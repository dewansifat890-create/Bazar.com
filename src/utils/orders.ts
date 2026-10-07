/**
 * User persistent orders and loyalty voucher manager.
 */

import { saveOrderToFirebase, subscribeToUserOrdersRealtime } from '../firebase';

const TOTAL_ORDERS_KEY = 'bazar_user_total_orders_v1';
const VOUCHERS_USED_KEY = 'bazar_user_used_vouchers_v1';

export function getUserTotalOrders(): number {
  try {
    const data = localStorage.getItem(TOTAL_ORDERS_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch (err) {
    console.error('Error getting total orders:', err);
    return 0;
  }
}

export function incrementUserOrders(count: number = 1): number {
  try {
    const current = getUserTotalOrders();
    const nextCount = current + count;
    localStorage.setItem(TOTAL_ORDERS_KEY, nextCount.toString());
    
    // Broadcast change
    window.dispatchEvent(new CustomEvent('bazar-orders-updated', {
      detail: { totalOrders: nextCount }
    }));
    
    return nextCount;
  } catch (err) {
    console.error('Error incrementing user orders:', err);
    return 0;
  }
}

export function resetUserOrders(): number {
  try {
    localStorage.setItem(TOTAL_ORDERS_KEY, '0');
    window.dispatchEvent(new CustomEvent('bazar-orders-updated', {
      detail: { totalOrders: 0 }
    }));
    return 0;
  } catch (err) {
    return 0;
  }
}

// -----------------------------------------------------
// SAVED ORDERS & IDENTITY VERIFICATION SYSTEM FOR ADMIN
// -----------------------------------------------------

export interface OrderRecord {
  id: string;
  itemName: string;
  itemPrice: number;
  itemImage: string;
  productId?: string;
  productOriginalName?: string;
  originalProduct?: any;
  customPrices?: Record<string, number>;
  shippingFee?: number;
  tax?: number;
  totalAmount?: number;
  shippingZone?: string;
  date: string;
  time?: string;
  orderTime?: string;
  createdAt?: number;
  status: string;
  paymentMethod?: 'cod' | 'bkash' | string;
  paymentStatus?: string;
  bKashSender?: string;
  bKashTrxId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  location: {
    fullName: string;
    mobile: string;
    district: string;
    upazila?: string;
    union?: string;
    area: string;
    deliveryArea: string;
    address?: string;
  };
  verification?: {
    isVerified: boolean;
    country: string;
    district: string;
    thana: string;
    village: string;
    dob: string;
    age: number;
    docFront?: string;
    docBack?: string;
    docBirthCert?: string;
  };
}

export function getSavedOrders(): OrderRecord[] {
  try {
    const data = localStorage.getItem('bazar_saved_orders_v1');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addNewSavedOrder(order: Partial<OrderRecord>) {
  try {
    const list = getSavedOrders();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newOrder: OrderRecord = {
      id: order.id || `BZR-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      itemName: order.itemName || 'Standard Product',
      itemPrice: order.itemPrice || 0,
      itemImage: order.itemImage || '',
      productId: order.productId,
      productOriginalName: order.productOriginalName,
      originalProduct: order.originalProduct,
      customPrices: order.customPrices,
      shippingFee: order.shippingFee || 0,
      tax: order.tax || 0,
      totalAmount: order.totalAmount || order.itemPrice || 0,
      shippingZone: order.shippingZone || '',
      date: order.date || `${formattedDate}, ${formattedTime}`,
      time: order.time || formattedTime,
      orderTime: order.orderTime || `${formattedDate} • ${formattedTime}`,
      createdAt: order.createdAt || Date.now(),
      status: order.status || 'Processing',
      paymentMethod: order.paymentMethod || 'cod',
      paymentStatus: order.paymentStatus || 'Pending',
      bKashSender: order.bKashSender,
      bKashTrxId: order.bKashTrxId,
      userId: order.userId || getOrGenerateUserId(),
      userName: order.userName || 'Shop Enthusiast',
      userAvatar: order.userAvatar || '',
      location: order.location || {
        fullName: 'No Specified Name',
        mobile: '',
        district: 'None',
        area: '',
        deliveryArea: ''
      },
      verification: order.verification
    };
    list.unshift(newOrder);
    localStorage.setItem('bazar_saved_orders_v1', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bazar-orders-list-updated'));

    // Immediately push the order to Firebase Realtime Database & Firestore for the Admin Panel
    saveOrderToFirebase(newOrder).catch((err) => {
      console.warn('Firebase order sync warning:', err);
    });
  } catch (err) {
    console.error('Error saving new orders:', err);
  }
}

// Keep local user orders synced if the Admin Panel updates status (e.g. Processing -> Shipped / Delivered)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      const currentUserId = getOrGenerateUserId();
      subscribeToUserOrdersRealtime(currentUserId, (remoteOrders) => {
        if (!Array.isArray(remoteOrders) || remoteOrders.length === 0) return;
        const local = getSavedOrders();
        if (local.length === 0) return;

        let updated = false;
        const remoteMap = new Map(remoteOrders.map((o) => [o.id, o]));

        const merged = local.map((item) => {
          const remote = remoteMap.get(item.id);
          if (remote && (remote.status !== item.status || remote.paymentStatus !== item.paymentStatus)) {
            updated = true;
            return {
              ...item,
              status: remote.status || item.status,
              paymentStatus: remote.paymentStatus || item.paymentStatus
            };
          }
          return item;
        });

        if (updated) {
          localStorage.setItem('bazar_saved_orders_v1', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('bazar-orders-list-updated'));
        }
      });
    } catch {}
  }, 800);
}

export function clearAllSavedOrders() {
  try {
    localStorage.removeItem('bazar_saved_orders_v1');
    window.dispatchEvent(new CustomEvent('bazar-orders-list-updated'));
  } catch {}
}

export function getOrGenerateUserId(firebaseUid?: string): string {
  try {
    if (firebaseUid) {
      // Deterministically create a unique 6-digit number ID from Firebase UID
      let hash = 0;
      for (let i = 0; i < firebaseUid.length; i++) {
        hash = (hash << 5) - hash + firebaseUid.charCodeAt(i);
        hash |= 0;
      }
      const uniqueNum = (Math.abs(hash) % 900000) + 100000;
      const formatted = `BZ-${uniqueNum}`;
      localStorage.setItem('bazar_user_id', formatted);
      return formatted;
    }

    let uid = localStorage.getItem('bazar_user_id');
    if (!uid) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      uid = `BZ-${randomNum}`;
      localStorage.setItem('bazar_user_id', uid);
    }
    return uid;
  } catch {
    return 'BZ-741920';
  }
}

export interface VerificationDetails {
  isVerified: boolean;
  country: string;
  district: string;
  thana: string;
  village: string;
  dob: string;
  age: number;
  docFront?: string;
  docBack?: string;
  docBirthCert?: string;
  realistic?: string;
}

export function getUserVerificationDetails(): VerificationDetails | null {
  try {
    const data = localStorage.getItem('bazar_user_verification_details');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveUserVerificationDetails(details: VerificationDetails) {
  try {
    localStorage.setItem('bazar_user_verification_details', JSON.stringify(details));
    window.dispatchEvent(new Event('bazar-profile-updated'));
  } catch (err) {
    console.error('Error saving verification details:', err);
  }
}

export function clearUserVerificationDetails() {
  try {
    localStorage.removeItem('bazar_user_verification_details');
    window.dispatchEvent(new Event('bazar-profile-updated'));
  } catch {}
}

