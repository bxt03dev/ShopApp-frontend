import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Category } from '../models/category';
import { environment } from '../common/environment';
import { ApiResponse } from '../dto/response/api.response';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiBaseUrl}/categories`;

  constructor(private http: HttpClient) {
    console.log('CategoryService initialized with URL:', this.apiUrl);
  }

  getCategories(): Observable<Category[]> {
    console.log('Fetching categories from:', this.apiUrl);
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl).pipe(
      map((response: ApiResponse<Category[]>) => {
        console.log('Categories fetched successfully:', response);
        if (!response.result) {
          console.error('No result property in response:', response);
          return [];
        }
        return response.result;
      }),
      catchError((error: any) => {
        console.error('Error fetching categories:', error);
        console.error('Error response:', error.error);
        throw error;
      })
    );
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.result)
    );
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, category).pipe(
      map(response => response.result)
    );
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, category).pipe(
      map(response => response.result)
    );
  }

  deleteCategory(id: number): Observable<void> {
    console.log('Deleting category with ID:', id);
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('Delete response:', response);
        return response.result;
      }),
      catchError((error: any) => {
        console.error('Error deleting category:', error);
        console.error('Error response:', error.error);
        throw error;
      })
    );
  }
}
