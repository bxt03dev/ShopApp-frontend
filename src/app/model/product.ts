import {ProductImage} from "./product.image";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  categoryId: string;
  quantity?: number;
  warrantyCode?: string;
  url?: string; // Optional, used for image URL
  productImages?: ProductImage[];
}
