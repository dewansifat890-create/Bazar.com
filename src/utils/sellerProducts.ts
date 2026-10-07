import { INITIAL_PRODUCTS } from '../constants';
import { getRoyalClubAdminSettings, getRoyalClubUserState, getAdjustedProduct } from './royalClub';
import { getLoginState } from './preferences';
import { 
  saveProductToFirestore, 
  fetchProductsFromFirestore,
  saveProductToRealtimeDatabase,
  fetchProductsFromRealtimeDatabase,
  subscribeToProductsRealtime,
  deleteProductFromRealtimeDatabase
} from '../firebase';

export interface ProductType {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: string;
  tag?: string;
  category: string;
  description?: string;
  customSpecs?: { label: string; value: string }[];
  customPrices?: Record<string, number>;
  hasSpinDiscountApplied?: boolean;
  defaultDiscount?: number;
  combinedDiscount?: number;
}

// Standardize any product object format from external admin panels or Firebase
export function normalizeProduct(raw: any): ProductType {
  const name = raw.name || raw.title || raw.productName || raw.product_name || 'Unnamed Product';
  
  // Parse price safely from number or string (e.g. "1200", "$15")
  let price = 0;
  if (typeof raw.price === 'number') price = raw.price;
  else if (typeof raw.price === 'string') price = parseFloat(raw.price.replace(/[^0-9.]/g, '')) || 0;
  else if (typeof raw.cost === 'number') price = raw.cost;
  else if (typeof raw.amount === 'number') price = raw.amount;
  else if (typeof raw.primaryPrice === 'string' || typeof raw.primaryPrice === 'number') {
    price = parseFloat(String(raw.primaryPrice).replace(/[^0-9.]/g, '')) || 0;
  }

  // Parse originalPrice
  let originalPrice = raw.originalPrice || raw.regularPrice || raw.oldPrice;
  if (typeof originalPrice === 'string') {
    originalPrice = parseFloat(originalPrice.replace(/[^0-9.]/g, '')) || undefined;
  }
  if (!originalPrice && price > 0) {
    originalPrice = Math.round(price * 1.5);
  }

  // Parse additional images (handles both arrays and Firebase objects like {0: "url1", 1: "url2"})
  let rawImages = raw.images || raw.gallery || raw.photos || raw.imageUrls || raw.additionalImages || [];
  let images: string[] = [];
  if (Array.isArray(rawImages)) {
    images = rawImages.filter((u: any) => typeof u === 'string' && u.trim() !== '');
  } else if (rawImages && typeof rawImages === 'object') {
    images = Object.values(rawImages).filter((u: any) => typeof u === 'string' && u.trim() !== '') as string[];
  }

  // Parse primary image solely from Firebase data (no hardcoded fallback)
  const image = raw.image || raw.img || raw.imageUrl || raw.image_url || raw.thumbnail || raw.photo || images[0] || '';

  return {
    ...raw,
    id: raw.id || raw._id || raw.key || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: String(name).trim(),
    price: price,
    originalPrice: originalPrice,
    image: image,
    images: images,
    rating: parseFloat(raw.rating) || 5.0,
    reviews: String(raw.reviews || raw.reviewsCount || '1'),
    tag: raw.tag || 'NEW',
    category: raw.category || 'General',
    description: raw.description || raw.details || '',
    customSpecs: raw.customSpecs || raw.specs || undefined,
    customPrices: raw.customPrices || undefined
  };
}

export function getMergedProducts(): ProductType[] {
  try {
    const custom = localStorage.getItem('bazar_custom_products');
    const parsedCustom = custom ? JSON.parse(custom) : [];
    // Ensure each custom product has standardized fields
    const standardizedCustom = parsedCustom.map((p: any) => normalizeProduct(p));
    const merged = [...INITIAL_PRODUCTS, ...standardizedCustom];

    // Read persistently deleted products
    const deleted = localStorage.getItem('bazar_deleted_product_names');
    let filtered = merged;
    if (deleted) {
      const deletedList = JSON.parse(deleted);
      filtered = merged.filter((p: any) => !deletedList.includes(p.name));
    }

    // Apply Royal Club spin discount in real-time if active
    const adminSettings = getRoyalClubAdminSettings();
    if (adminSettings.campaignActive) {
      const loginState = getLoginState();
      const userId = loginState.phoneOrEmail || '01712345678';
      const userState = getRoyalClubUserState(userId);

      if (userState.activeDiscount > 0) {
        return filtered.map((p: any) => 
          getAdjustedProduct(p, userState.activeDiscount, adminSettings.exclusionLimit)
        ) as ProductType[];
      }
    }

    return filtered;
  } catch (e) {
    console.error('Error fetching custom products:', e);
    return INITIAL_PRODUCTS;
  }
}

// Add a product locally and sync to Firebase Realtime Database & Firestore
export async function addCustomProduct(product: ProductType) {
  try {
    const custom = localStorage.getItem('bazar_custom_products');
    const list = custom ? JSON.parse(custom) : [];
    list.push(product);
    localStorage.setItem('bazar_custom_products', JSON.stringify(list));
    
    // Immediately notify UI across entire app
    window.dispatchEvent(new CustomEvent('bazar-products-updated'));

    // Save to Firebase Realtime Database (with public read/write)
    saveProductToRealtimeDatabase(product).catch(e => console.warn('RTDB save note:', e));

    // Also backup to Firebase Firestore
    saveProductToFirestore(product).catch(e => console.warn('Firestore save note:', e));
  } catch (e) {
    console.error('Error saving custom product:', e);
  }
}

// Sync products from Firebase Realtime Database and Firestore
export async function syncProductsFromFirebase(): Promise<ProductType[]> {
  try {
    // 1. Try Realtime Database first
    const { products: rtdbProducts } = await fetchProductsFromRealtimeDatabase();
    // 2. Try Firestore as backup
    const { products: firestoreProducts } = await fetchProductsFromFirestore();

    let incoming = [...(rtdbProducts || []), ...(firestoreProducts || [])];

    // 3. REST fallback to ensure RTDB reads even if SDK auth rules differ
    if (incoming.length === 0) {
      try {
        const restRes = await fetch('https://bazar-com-2f14f-default-rtdb.firebaseio.com/products.json');
        if (restRes.ok) {
          const restData = await restRes.json();
          if (restData) {
            Object.keys(restData).forEach(k => {
              if (restData[k]) {
                incoming.push({ id: k, ...restData[k] });
              }
            });
          }
        }
      } catch (restErr) {
        console.warn('REST fallback note:', restErr);
      }
    }

    if (incoming.length > 0) {
      // Normalize all incoming items from external admin app
      const normalizedList: ProductType[] = [];
      const seen = new Set<string>();

      incoming.forEach((raw: any) => {
        const p = normalizeProduct(raw);
        const key = p.name ? p.name.trim().toLowerCase() : (p.id || '');
        if (key && !seen.has(key)) {
          seen.add(key);
          normalizedList.push(p);
        }
      });

      localStorage.setItem('bazar_custom_products', JSON.stringify(normalizedList));
      window.dispatchEvent(new CustomEvent('bazar-products-updated'));
      return normalizedList;
    } else {
      // If nothing in Firebase, clear custom products so website remains clean
      localStorage.removeItem('bazar_custom_products');
      window.dispatchEvent(new CustomEvent('bazar-products-updated'));
      return [];
    }
  } catch (e) {
    console.warn('Error syncing products from Firebase:', e);
  }
  return getMergedProducts();
}

// Listen for live Realtime Database changes (Zero redundant polling to minimize Firebase calls)
if (typeof window !== 'undefined') {
  // One-time cleanup of any old cached test product in browser localStorage
  if (!localStorage.getItem('bazar_clean_slate_v2')) {
    localStorage.removeItem('bazar_custom_products');
    localStorage.setItem('bazar_clean_slate_v2', 'true');
  }

  // Immediate initial sync on load
  syncProductsFromFirebase().catch(() => {});

  // Single persistent Realtime stream listener from Firebase Realtime Database
  try {
    subscribeToProductsRealtime((rtdbProducts) => {
      if (Array.isArray(rtdbProducts)) {
        if (rtdbProducts.length === 0) {
          localStorage.removeItem('bazar_custom_products');
          window.dispatchEvent(new CustomEvent('bazar-products-updated'));
          return;
        }

        const normalizedList: ProductType[] = [];
        const seen = new Set<string>();

        rtdbProducts.forEach((raw: any) => {
          const p = normalizeProduct(raw);
          const key = p.name ? p.name.trim().toLowerCase() : (p.id || '');
          if (key && !seen.has(key)) {
            seen.add(key);
            normalizedList.push(p);
          }
        });

        localStorage.setItem('bazar_custom_products', JSON.stringify(normalizedList));
        window.dispatchEvent(new CustomEvent('bazar-products-updated'));
      }
    });
  } catch (err) {
    console.warn('Realtime listener subscription note:', err);
  }
}

export function resetCustomProducts() {
  try {
    localStorage.removeItem('bazar_custom_products');
    localStorage.removeItem('bazar_deleted_product_names');
    window.dispatchEvent(new CustomEvent('bazar-products-updated'));
  } catch (e) {
    console.error('Error resetting custom products:', e);
  }
}

export function deleteCustomProduct(name: string) {
  try {
    const custom = localStorage.getItem('bazar_custom_products');
    if (custom) {
      const list = JSON.parse(custom);
      const filtered = list.filter((p: any) => p.name !== name);
      localStorage.setItem('bazar_custom_products', JSON.stringify(filtered));
    }

    const deleted = localStorage.getItem('bazar_deleted_product_names');
    const deletedList = deleted ? JSON.parse(deleted) : [];
    if (!deletedList.includes(name)) {
      deletedList.push(name);
      localStorage.setItem('bazar_deleted_product_names', JSON.stringify(deletedList));
    }

    // Delete from Firebase Realtime Database as well
    deleteProductFromRealtimeDatabase(name).catch(e => console.warn('RTDB delete note:', e));

    window.dispatchEvent(new CustomEvent('bazar-products-updated'));
  } catch (e) {
    console.error('Error deleting custom product:', e);
  }
}
