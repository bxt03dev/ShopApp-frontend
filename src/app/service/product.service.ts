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

  getDetailProduct(productId: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${environment.apiBaseUrl}/products/${productId}`);
  }

  getProductsByIds(productIds: number[]): Observable<ApiResponse<Product[]>> {
    debugger
    const params = new HttpParams().set('ids', productIds.join(','));
    console.log(params)
    return this.http.get<ApiResponse<Product[]>>(`${this.apiGetProducts}/by-ids`, { params });
  }
}
