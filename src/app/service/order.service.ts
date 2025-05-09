import { ProductService } from './product.service'
import { Injectable } from '@angular/core'
import {
  HttpClient,
  HttpParams,
  HttpHeaders
} from '@angular/common/http'
import { Observable } from 'rxjs'



import {environment} from "../common/environment";
import {OrderDTO} from "../dto/user/order.dto";
import {OrderResponse} from "../response/order/order.response";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiBaseUrl}/orders`
  private apiGetAllOrders = `${environment.apiBaseUrl}/orders/get-orders-by-keyword`

  constructor(private http: HttpClient) {
  }

  placeOrder(orderData: OrderDTO): Observable<any> {
    return this.http.post(this.apiUrl, orderData)
  }

  getOrderById(orderId: number): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`
    return this.http.get(url)
  }

  getAllOrders(keyword: string, page: number, limit: number) {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      keyword: keyword
    };
    return this.http.get<any>(`${environment.apiBaseUrl}/orders/get-orders-by-keyword`, { params });
  }

  updateOrder(orderId: number, orderData: OrderDTO): Observable<Object> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`
    return this.http.put(url, orderData)
  }

  deleteOrder(orderId: number): Observable<any> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`
    return this.http.delete(url, {responseType: 'text'})
  }
}
