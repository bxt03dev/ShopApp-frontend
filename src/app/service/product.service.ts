import { Injectable } from '@angular/core';
import { environment } from '../common/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../model/product';
import {ApiResponse} from "../dto/response/api.response";

interface ProductListResponse {
  products: Product[];
  totalPages: number;
}

export interface ProductDTO {
  name: string;
  price: number;
  description: string;
  categoryId: string;
  thumbnail?: string;
  quantity?: number;
  warrantyCode?: string;
  dateRelease?: Date;
  isOnSale?: boolean;
  isActive?: boolean;
}

export interface UpdateProductDTO extends ProductDTO {}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiGetProducts = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(page: number, limit: number): Observable<ApiResponse<ProductListResponse>> {
    const params = new HttpParams()
      .append('page', page.toString())
      .append('limit', limit.toString());
    return this.http.get<ApiResponse<ProductListResponse>>(this.apiGetProducts, { params });
  }

  getProductsByCategory(categoryId: number, page: number, limit: number): Observable<ApiResponse<ProductListResponse>> {
    const params = new HttpParams()
      .append('page', page.toString())
      .append('limit', limit.toString())
      .append('category_id', categoryId.toString());
    return this.http.get<ApiResponse<ProductListResponse>>(this.apiGetProducts, { params });
  }

  getDetailProduct(productId: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${environment.apiBaseUrl}/products/${productId}`);
  }

  getProductsByIds(productIds: number[]): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams().set('ids', productIds.join(','));
    return this.http.get<ApiResponse<Product[]>>(`${this.apiGetProducts}/by-ids`, { params });
  }

  deleteProduct(productId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${environment.apiBaseUrl}/products/${productId}`);
  }
  
  updateProduct(productId: number, updatedProduct: UpdateProductDTO): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${environment.apiBaseUrl}/products/${productId}`, updatedProduct);
  }

  createProduct(product: ProductDTO): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${environment.apiBaseUrl}/products`, product);
  }

  uploadProductImage(productId: number, file: File): Observable<any> {
    const formData = new FormData();
    const fileList = [file];
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }
    
    const headers = {
      'Accept': 'application/json'
    };
    
    return this.http.post<any>(
      `${environment.apiBaseUrl}/products/uploads/${productId}`, 
      formData,
      { headers }
    );
  }
}
