import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  push as rtdbPush,
  get as rtdbGet,
  remove as rtdbRemove,
  onValue as rtdbOnValue
} from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyAYWqwDWP4O-3-AR8rmCqZPE0-WDvamC6g",
  authDomain: "bazar-com-2f14f.firebaseapp.com",
  databaseURL: "https://bazar-com-2f14f-default-rtdb.firebaseio.com",
  projectId: "bazar-com-2f14f",
  storageBucket: "bazar-com-2f14f.firebasestorage.app",
  messagingSenderId: "526863759989",
  appId: "1:526863759989:web:214de7c02b4f0d5dce163c",
  measurementId: "G-E6SNPFK8NW"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Analytics initialization
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn('Analytics init error:', e);
      }
    }
  }).catch(() => {});
}
export { analytics };

export interface AuthErrorInfo {
  code: string;
  message: string;
  isDomainError?: boolean;
  isProviderError?: boolean;
  currentDomain?: string;
}

// Detailed error message translator for Firebase
export function getFirebaseFriendlyError(error: any): AuthErrorInfo {
  const code = error?.code || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return {
        code,
        message: 'লগইন সার্ভিস বর্তমানে এই ডোমেইনে অনুমোদিত নয়। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।',
        isDomainError: true,
        currentDomain
      };
    case 'auth/operation-not-allowed':
      return {
        code,
        message: 'Google সাইন-ইন সার্ভিস বর্তমানে সাময়িকভাবে বন্ধ আছে। অনুগ্রহ করে পরে চেষ্টা করুন।',
        isProviderError: true
      };
    case 'auth/popup-closed-by-user':
      return {
        code,
        message: 'Google লগইন পপ-আপ উইন্ডোটি বন্ধ করা হয়েছে। আবার চেষ্টা করুন।'
      };
    case 'auth/popup-blocked':
      return {
        code,
        message: 'আপনার ব্রাউজার পপ-আপ ব্লক করেছে। ব্রাউজারের পপ-আপ পারমিশন Allow করে আবার চেষ্টা করুন।'
      };
    case 'auth/cancelled-popup-request':
      return {
        code,
        message: 'লগইন প্রক্রিয়া বাতিল করা হয়েছে।'
      };
    case 'auth/network-request-failed':
      return {
        code,
        message: 'ইন্টারনেট বা নেটওয়ার্ক সংযোগ ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
      };
    default:
      return {
        code: code || 'auth/unknown',
        message: error?.message || 'লগইন করতে একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      };
  }
}

// Pure Google Sign In
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    const friendly = getFirebaseFriendlyError(error);
    return { user: null, error: friendly };
  }
}

// Logout
export async function logoutFirebase() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
}

// Subscribe to Auth State
export function onAuthUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore: Save product
export async function saveProductToFirestore(product: any) {
  try {
    const colRef = collection(db, 'products');
    const docRef = await addDoc(colRef, {
      ...product,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, error: null };
  } catch (err: any) {
    console.warn('Firestore write warning:', err?.message);
    return { id: null, error: err?.message };
  }
}

// Firestore: Fetch all products
export async function fetchProductsFromFirestore() {
  try {
    const colRef = collection(db, 'products');
    let snap;
    try {
      snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
    } catch {
      // Fallback without orderBy in case index or createdAt field doesn't exist in admin app
      snap = await getDocs(colRef);
    }
    const list: any[] = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { products: list, error: null };
  } catch (err: any) {
    console.warn('Firestore fetch warning:', err?.message);
    return { products: [], error: err?.message };
  }
}

// Realtime Database: Save product
export async function saveProductToRealtimeDatabase(product: any) {
  try {
    const productsRef = rtdbRef(rtdb, 'products');
    const newProductRef = rtdbPush(productsRef);
    await rtdbSet(newProductRef, {
      ...product,
      id: newProductRef.key,
      createdAt: new Date().toISOString()
    });
    return { id: newProductRef.key, error: null };
  } catch (err: any) {
    console.warn('Realtime Database write warning, trying REST fallback:', err?.message);
    try {
      const res = await fetch('https://bazar-com-2f14f-default-rtdb.firebaseio.com/products.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        return { id: data?.name, error: null };
      }
    } catch (restErr) {
      console.warn('REST save error:', restErr);
    }
    return { id: null, error: err?.message };
  }
}

// Helper to extract product array from dedicated product snapshot data
function extractProductsFromData(data: any): any[] {
  if (!data) return [];
  const list: any[] = [];
  
  if (Array.isArray(data)) {
    data.forEach((item, idx) => {
      if (item && typeof item === 'object') {
        const hasTitle = item.name || item.title || item.productName || item.product_name;
        const hasPrice = item.price !== undefined || item.cost !== undefined || item.amount !== undefined || item.primaryPrice !== undefined;
        if (hasTitle && hasPrice) {
          list.push({ id: item.id || `item_${idx}`, ...item });
        }
      }
    });
    return list;
  }

  if (typeof data === 'object') {
    // If it has a nested "products" or "items" node, only look inside those
    if (data.products && typeof data.products === 'object') {
      return extractProductsFromData(data.products);
    }
    if (data.items && typeof data.items === 'object') {
      return extractProductsFromData(data.items);
    }

    const nonProductKeys = new Set(['customers', 'orders', 'users', 'banners', 'heroBanners', 'settings', 'adminSettings', 'chats', 'messages', 'reviews']);

    Object.keys(data).forEach((key) => {
      if (nonProductKeys.has(key)) return;
      const val = data[key];
      if (val && typeof val === 'object') {
        const hasTitle = val.name || val.title || val.productName || val.product_name;
        const hasPrice = val.price !== undefined || val.cost !== undefined || val.amount !== undefined || val.primaryPrice !== undefined;
        // Must have both a product title and a price, and must not be a customer or order record
        const isCustomerOrOrder = val.completedOrdersCount !== undefined || val.joinedDate !== undefined || val.customerPhone !== undefined || val.orderTime !== undefined;
        if (hasTitle && hasPrice && !isCustomerOrOrder) {
          list.push({ id: key, ...val });
        }
      }
    });
  }
  return list;
}

// Realtime Database: Fetch products once from /products
export async function fetchProductsFromRealtimeDatabase() {
  try {
    const productsRef = rtdbRef(rtdb, 'products');
    const snapshot = await rtdbGet(productsRef);
    let list: any[] = [];
    if (snapshot.exists()) {
      list = extractProductsFromData(snapshot.val());
    }
    return { products: list, error: null };
  } catch (err: any) {
    console.warn('Realtime Database fetch warning:', err?.message);
    return { products: [], error: err?.message };
  }
}

// Realtime Database: Listen in real-time
export function subscribeToProductsRealtime(callback: (products: any[]) => void) {
  try {
    const productsRef = rtdbRef(rtdb, 'products');
    return rtdbOnValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const list = extractProductsFromData(snapshot.val());
        callback(list);
      } else {
        callback([]);
      }
    }, (error) => {
      console.warn('Realtime Database listener error:', error);
    });
  } catch (e) {
    console.warn('Failed to subscribe to RTDB products:', e);
    return () => {};
  }
}

// Realtime Database: Delete product
export async function deleteProductFromRealtimeDatabase(productIdOrName: string) {
  try {
    const productsRef = rtdbRef(rtdb, 'products');
    const snapshot = await rtdbGet(productsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key of Object.keys(data)) {
        if (key === productIdOrName || data[key]?.name?.trim()?.toLowerCase() === productIdOrName.trim().toLowerCase()) {
          await rtdbRemove(rtdbRef(rtdb, `products/${key}`));
        }
      }
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Realtime Database delete error:', err);
    return { success: false, error: err?.message };
  }
}

// Helper to normalize any banner object or URL string from Firebase
export function normalizeBannerItem(raw: any, index: number = 0) {
  if (typeof raw === 'string' && raw.trim() !== '') {
    return {
      id: `banner_${index}`,
      image: raw.trim(),
      tag: '',
      title: '',
      subtitle: '',
      active: true
    };
  }
  if (!raw || typeof raw !== 'object') return null;

  const image = raw.image || raw.img || raw.imageUrl || raw.image_url || raw.bannerUrl || raw.banner_url || raw.url || raw.photo || raw.src || '';
  if (!image || typeof image !== 'string' || image.trim() === '') return null;

  return {
    id: String(raw.id || raw._id || raw.key || `banner_${index}`),
    image: image.trim(),
    tag: String(raw.tag || raw.badge || raw.label || ''),
    title: String(raw.title || raw.heading || raw.name || ''),
    subtitle: String(raw.subtitle || raw.description || raw.subTitle || raw.text || ''),
    active: raw.active !== false && raw.enabled !== false && raw.status !== 'inactive',
    linkCategory: raw.linkCategory || raw.category || undefined
  };
}

// Extract hero banners array from arbitrary RTDB or Firestore structure
export function extractBannersFromData(data: any): any[] {
  if (!data) return [];
  const rawList: any[] = [];

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (item) rawList.push(item);
    });
  } else if (typeof data === 'object') {
    // Check common nested keys if root snapshot was passed
    const candidateKeys = [
      'banners',
      'heroBanners',
      'hero_banners',
      'carousel',
      'heroCarousel',
      'hero_carousel',
      'sliders',
      'slider',
      'slides'
    ];

    for (const k of candidateKeys) {
      if (data[k] && typeof data[k] === 'object') {
        const extracted = extractBannersFromData(data[k]);
        if (extracted.length > 0) return extracted;
      }
    }

    // Check inside settings or adminSettings if present
    if (data.settings && typeof data.settings === 'object') {
      const extracted = extractBannersFromData(data.settings);
      if (extracted.length > 0) return extracted;
    }
    if (data.adminSettings && typeof data.adminSettings === 'object') {
      const extracted = extractBannersFromData(data.adminSettings);
      if (extracted.length > 0) return extracted;
    }

    // Otherwise treat object keys as individual banner records if they look like banners (and not products, customers, or orders)
    const nonBannerKeys = new Set(['customers', 'orders', 'products', 'items', 'users', 'chats', 'messages', 'reviews']);
    Object.keys(data).forEach((key) => {
      if (nonBannerKeys.has(key)) return;
      const val = data[key];
      if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:image'))) {
        rawList.push({ id: key, image: val });
      } else if (val && typeof val === 'object') {
        const hasImage = val.image || val.img || val.imageUrl || val.image_url || val.bannerUrl || val.banner_url || val.url || val.photo || val.src;
        const isProductOrCustomer = val.price !== undefined || val.productName !== undefined || val.cost !== undefined || val.completedOrdersCount !== undefined || val.joinedDate !== undefined || val.customerPhone !== undefined;
        if (hasImage && !isProductOrCustomer) {
          rawList.push({ id: key, ...val });
        }
      }
    });
  }

  return rawList
    .map((item, idx) => normalizeBannerItem(item, idx))
    .filter((b): b is NonNullable<typeof b> => Boolean(b && b.active && b.image));
}

// Fetch Hero Banners from Firebase Realtime Database & Firestore
export async function fetchBannersFromFirebase(): Promise<any[]> {
  const bannerPaths = ['banners', 'heroBanners', 'hero_banners', 'carousel', 'sliders', 'slider'];

  // 1. Try Realtime Database paths
  for (const path of bannerPaths) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, path));
      if (snap.exists()) {
        const list = extractBannersFromData(snap.val());
        if (list.length > 0) return list;
      }
    } catch {
      // continue trying next path
    }
  }

  // 2. Try root scan in Realtime Database
  try {
    const rootSnap = await rtdbGet(rtdbRef(rtdb, '/'));
    if (rootSnap.exists()) {
      const list = extractBannersFromData(rootSnap.val());
      if (list.length > 0) return list;
    }
  } catch {
    // ignore
  }

  // 3. Try REST API fallback on RTDB
  for (const path of [...bannerPaths, '']) {
    try {
      const url = path
        ? `https://bazar-com-2f14f-default-rtdb.firebaseio.com/${path}.json`
        : `https://bazar-com-2f14f-default-rtdb.firebaseio.com/.json`;
      const res = await fetch(url);
      if (res.ok) {
        const restData = await res.json();
        const list = extractBannersFromData(restData);
        if (list.length > 0) return list;
      }
    } catch {
      // ignore
    }
  }

  // 4. Try Firestore collections ('banners', 'heroBanners', 'carousel', 'sliders')
  for (const colName of ['banners', 'heroBanners', 'carousel', 'sliders']) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const docs: any[] = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        const list = extractBannersFromData(docs);
        if (list.length > 0) return list;
      }
    } catch {
      // ignore
    }
  }

  return [];
}

// Real-time listener for Hero Banners across common RTDB paths and root
export function subscribeToBannersRealtime(callback: (banners: any[]) => void) {
  const unsubscribes: Array<() => void> = [];
  const paths = ['banners', 'heroBanners', 'hero_banners', 'carousel', 'sliders', '/'];

  paths.forEach((path) => {
    try {
      const ref = rtdbRef(rtdb, path);
      const unsub = rtdbOnValue(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const list = extractBannersFromData(snapshot.val());
            if (list.length > 0 || path === 'banners' || path === 'heroBanners') {
              callback(list);
            }
          } else if (path === 'banners' || path === 'heroBanners') {
            // If deleted in admin, trigger re-fetch to check if any other path has banners
            fetchBannersFromFirebase().then((fresh) => callback(fresh)).catch(() => {});
          }
        },
        () => {}
      );
      unsubscribes.push(unsub);
    } catch {
      // ignore
    }
  });

  return () => {
    unsubscribes.forEach((u) => {
      try {
        u();
      } catch {}
    });
  };
}

// Helper to recursively strip undefined properties so Firebase RTDB/Firestore never rejects the payload
function sanitizeForFirebase(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirebase(item));
  }
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = sanitizeForFirebase(val);
    }
  });
  return cleaned;
}

// Save a new customer order to Firebase Realtime Database AND Firestore so the external Admin Panel receives it immediately
export async function saveOrderToFirebase(order: any) {
  const orderId = order.id || `BZR-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanOrder = sanitizeForFirebase({
    ...order,
    id: orderId,
    orderId: orderId,
    customerName: order.location?.fullName || order.userName || 'Customer',
    customerPhone: order.location?.mobile || '',
    customerAddress: [
      order.location?.address,
      order.location?.area,
      order.location?.union,
      order.location?.upazila,
      order.location?.district
    ].filter(Boolean).join(', '),
    productName: order.productOriginalName || order.itemName || 'Product',
    price: order.totalAmount || order.itemPrice || 0,
    total: order.totalAmount || order.itemPrice || 0,
    image: order.itemImage || '',
    createdAtIso: new Date().toISOString()
  });

  // 1. Save to Firebase Realtime Database under `orders/<orderId>`
  try {
    const orderRef = rtdbRef(rtdb, `orders/${orderId}`);
    await rtdbSet(orderRef, cleanOrder);
  } catch (err: any) {
    console.warn('RTDB order write warning, trying REST fallback:', err?.message);
    try {
      await fetch(`https://bazar-com-2f14f-default-rtdb.firebaseio.com/orders/${encodeURIComponent(orderId)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanOrder)
      });
    } catch (restErr) {
      console.warn('REST order save error:', restErr);
    }
  }

  // 2. Also save to Firestore `orders` collection as backup for admin panels using Firestore
  try {
    await addDoc(collection(db, 'orders'), cleanOrder);
  } catch (fsErr) {
    // ignore if Firestore rules or collection not used
  }

  return { id: orderId };
}

// Listen to orders in Firebase Realtime Database so if Admin updates order status (e.g. Delivered/Shipped), user sees it live
export function subscribeToUserOrdersRealtime(userId: string, callback: (orders: any[]) => void) {
  try {
    const ordersRef = rtdbRef(rtdb, 'orders');
    return rtdbOnValue(
      ordersRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const userOrders: any[] = [];
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const ord = data[key];
            if (ord && typeof ord === 'object') {
              if (!userId || ord.userId === userId) {
                userOrders.push({ id: key, ...ord });
              }
            }
          });
        }
        if (userOrders.length > 0) {
          userOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          callback(userOrders);
        }
      },
      () => {}
    );
  } catch {
    return () => {};
  }
}

