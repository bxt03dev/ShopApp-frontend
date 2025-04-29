import { Injectable } from '@angular/core';
import { environment } from '../common/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../model/product';

interface ProductListResponse {
  products: Product[];
  totalPages: number;
}

interface ApiResponse {
  result: ProductListResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiGetProducts = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) { }

  getProducts(page: number, limit: number): Observable<ApiResponse> {
    const params = new HttpParams()
      .append('page', page.toString())
      .append('limit', limit.toString());
    return this.http.get<ApiResponse>(this.apiGetProducts, { params });
  }
}
