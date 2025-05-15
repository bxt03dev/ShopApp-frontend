import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';

export interface PaymentDTO {
  order_id: number;
  payment_method: string;
  amount: number;
  transaction_id?: string;
  transaction_status?: string;
  bank_code?: string;
  vpc_order_info?: string;
}

export interface PaymentResponse {
  payment_url: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl = `${environment.apiBaseUrl}/payments`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    console.log('Payment Service initialized with base URL:', this.baseUrl);
  }

  createPayment(paymentData: PaymentDTO): Observable<PaymentResponse> {
    const url = `${this.baseUrl}/create`;
    console.log('Gửi request đến:', url);
    console.log('Payload:', paymentData);
    
    // Kiểm tra dữ liệu đầu vào
    if (!paymentData.order_id || isNaN(Number(paymentData.order_id))) {
      console.error('Mã đơn hàng không hợp lệ:', paymentData.order_id);
      return throwError(() => new Error('Mã đơn hàng không hợp lệ'));
    }
    
    if (!paymentData.amount || isNaN(Number(paymentData.amount)) || Number(paymentData.amount) <= 0) {
      console.error('Số tiền thanh toán không hợp lệ:', paymentData.amount);
      return throwError(() => new Error('Số tiền thanh toán không hợp lệ'));
    }
    
    // Tạo HTTP headers
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Thêm token nếu có
    const token = this.tokenService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Đã thêm token vào header');
    } else {
      console.warn('Không tìm thấy token xác thực khi tạo thanh toán');
    }
    
    // Chuyển đổi dữ liệu để đảm bảo đúng định dạng JSON
    const rawData = {
      order_id: Number(paymentData.order_id),
      payment_method: paymentData.payment_method,
      amount: Number(paymentData.amount)
    };
    
    console.log('Headers:', headers);
    console.log('Raw data sent to server:', JSON.stringify(rawData));
    
    return this.http.post<PaymentResponse>(url, rawData, { headers })
      .pipe(
        tap(response => console.log('Response from payment API:', response)),
        catchError(this.handleError)
      );
  }

  getPaymentByOrderId(orderId: number): Observable<any> {
    const url = `${this.baseUrl}/orders/${orderId}`;
    
    // Tạo HTTP headers
    let headers = new HttpHeaders();
    
    // Thêm token nếu có
    const token = this.tokenService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get(url, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error in PaymentService:', error);
    let errorMessage = 'Đã xảy ra lỗi không xác định';
    
    if (error.error instanceof ErrorEvent) {
      // Lỗi phía client
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Lỗi từ backend
      errorMessage = `Mã lỗi: ${error.status}, Thông báo: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
      
      // Handle specific error codes
      if (error.status === 403) {
        errorMessage = 'Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại.';
      } else if (error.status === 401) {
        errorMessage = 'Bạn không được phép thực hiện thao tác này. Vui lòng đăng nhập.';
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
} 