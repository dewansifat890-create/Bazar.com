export interface Product {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: string;
  tag?: string;
  tagColor?: string;
  category: string;
}

export const INITIAL_PRODUCTS: Product[] = [];

