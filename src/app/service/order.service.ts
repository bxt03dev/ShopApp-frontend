import { ProductService } from './product.service'
import { Injectable } from '@angular/core'
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

import {environment} from "../common/environment";
import {OrderDTO} from "../dto/user/order.dto";
import {OrderResponse} from "../response/order/order.response";
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiBaseUrl}/orders`
  private apiGetAllOrders = `${environment.apiBaseUrl}/orders/get-orders-by-keyword`

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
  }

  placeOrder(orderData: OrderDTO): Observable<any> {
    console.log('Sending order data:', JSON.stringify(orderData));
    console.log('API URL:', this.apiUrl);
    
    // Check for valid userId
    if (!orderData.userId || orderData.userId <= 0) {
      console.error('Invalid userId in order data:', orderData.userId);
      return throwError(() => new Error('Invalid user ID. Please log in and try again.'));
    }

    // Ensure all required fields are present
    if (!orderData.fullName || !orderData.email || !orderData.phoneNumber || !orderData.address) {
      console.error('Missing required fields in order data');
      return throwError(() => new Error('Please fill in all required information.'));
    }

    // Check if cart is not empty
    if (!orderData.cartItems || orderData.cartItems.length === 0) {
      console.error('Cart is empty');
      return throwError(() => new Error('Your cart is empty. Please add items to your cart.'));
    }

    // Ensure we have a valid token
    const token = this.tokenService.getToken();
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('Bạn cần đăng nhập để đặt hàng.'));
    }

    // Check if token is expired
    if (this.tokenService.isTokenExpired()) {
      console.error('Token is expired');
      this.tokenService.removeToken(); // Clear the expired token
      return throwError(() => new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
    }

    // Create headers with authentication
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Send the request with error handling
    return this.http.post(this.apiUrl, orderData, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Order placement error:', error);
          
          if (error.status === 403) {
            console.error('Authentication error (403 Forbidden):', error);
            this.tokenService.removeToken(); // Clear the potentially invalid token
            return throwError(() => new Error('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'));
          } else if (error.status === 401) {
            console.error('Authorization error (401 Unauthorized):', error);
            this.tokenService.removeToken(); // Clear the potentially invalid token
            return throwError(() => new Error('Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.'));
          } else if (error.error && error.error.message) {
            return throwError(() => new Error(error.error.message));
          }
          return throwError(() => new Error('An error occurred while placing your order. Please try again.'));
        })
      );
  }

  getOrderById(orderId: number): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`
    return this.http.get(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error fetching order details for ID ${orderId}:`, error);
        return throwError(() => new Error('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.'));
      })
    );
  }

  getOrderDetail(orderId: number): Observable<any> {
    return this.getOrderById(orderId);
  }

  getAllOrders(keyword: string, page: number, limit: number) {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      keyword: keyword
    };
    return this.http.get<any>(`${environment.apiBaseUrl}/orders/get-orders-by-keyword`, { params });
  }

  updateOrder(orderId: number, orderData: any): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`;
    console.log('Update URL:', url);
    console.log('Update data:', orderData);
    
    // Chuyển đổi sang plain object nếu là OrderDTO
    const payload = orderData instanceof OrderDTO ? { ...orderData } : orderData;
    
    // Đảm bảo trường status được đưa vào payload
    if (payload.status) {
      console.log('Status in payload:', payload.status);
    } else {
      console.warn('Status not found in payload!');
    }
    
    return this.http.put(url, payload);
  }

  deleteOrder(orderId: number): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`
    return this.http.delete(url, {responseType: 'text'})
  }
  
  // Cancel an order
  cancelOrder(orderId: number): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}/cancel`;
    return this.http.put(url, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error cancelling order ${orderId}:`, error);
        return throwError(() => new Error('Không thể hủy đơn hàng. Vui lòng thử lại sau.'));
      })
    );
  }
  
  // Generate a warranty code for an order
  generateWarrantyCode(orderId: number): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}/warranty`;
    
    // Generate a random warranty code
    const warrantyCode = this.generateRandomWarrantyCode();
    
    return this.http.post(url, { warrantyCode }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error generating warranty code for order ${orderId}:`, error);
        return throwError(() => new Error('Không thể tạo mã bảo hành. Vui lòng thử lại sau.'));
      })
    );
  }
  
  // Helper to generate random warranty code while waiting for backend implementation
  private generateRandomWarrantyCode(): string {
    // Format: AP-YYYY-XXXX-XXXX
    const year = new Date().getFullYear();
    const randomPart1 = Math.floor(1000 + Math.random() * 9000);
    const randomPart2 = Math.floor(1000 + Math.random() * 9000);
    
    return `AP-${year}-${randomPart1}-${randomPart2}`;
  }
  
  // Get orders by user ID
  getOrdersByUserId(userId: number, page: number = 0, limit: number = 10): Observable<any> {
    // Sử dụng endpoint chính xác từ backend: /orders/user/{user_id}
    const url = `${environment.apiBaseUrl}/orders/user/${userId}`;
    
    console.log(`Calling API: ${url} for user ID: ${userId}`);
    
    // Thêm token vào header để đảm bảo xác thực
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<any>(url, { headers }).pipe(
      tap(response => {
        console.log('API Response from orders/user endpoint:', response);
        
        // Check if response is in expected format
        if (response && response.result) {
          console.log('Orders in response:', response.result);
        } else {
          console.log('Response does not contain expected "result" property');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error fetching orders for user ${userId}:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        return throwError(() => new Error('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.'));
      })
    );
  }
}
