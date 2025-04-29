export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  categoryId: string;
  url?: string; // Optional, used for image URL
}
