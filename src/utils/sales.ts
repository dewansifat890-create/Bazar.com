/**
 * Sales count manager for Bazar catalog items.
 * Persists clicks on "Buy Now" and "Add to Cart" to localStorage.
 */

const STORAGE_KEY = 'bazar_product_sales_v1';

export function getProductSales(productName: string): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data);
    return parsed[productName] || 0;
  } catch (err) {
    console.error('Error reading product sales:', err);
    return 0;
  }
}

export function incrementProductSales(productName: string, amount: number = 1): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    const current = parsed[productName] || 0;
    const nextCount = current + amount;
    parsed[productName] = nextCount;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    // Broadcast change so UI can react in real-time
    window.dispatchEvent(new CustomEvent('bazar-sales-updated', {
      detail: { productName, sales: nextCount }
    }));
    
    return nextCount;
  } catch (err) {
    console.error('Error incrementing product sales:', err);
    return 0;
  }
}

export function getAllProductSalesList(): { [key: string]: number } {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Error reading all sales list:', err);
    return {};
  }
}

export function getProductRatingAndReviews(productName: string): { rating: number; reviewsCount: number } {
  try {
    const stored = localStorage.getItem('bazar_global_user_reviews');
    if (!stored) {
      return { rating: 0, reviewsCount: 0 };
    }
    const parsed = JSON.parse(stored);
    const matched = parsed.filter((rev: any) => rev.productName === productName);
    if (matched.length === 0) {
      return { rating: 0, reviewsCount: 0 };
    }
    const sum = matched.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
    const avg = parseFloat((sum / matched.length).toFixed(1));
    return { rating: avg, reviewsCount: matched.length };
  } catch {
    return { rating: 0, reviewsCount: 0 };
  }
}
