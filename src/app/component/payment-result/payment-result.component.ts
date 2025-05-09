import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../service/payment.service';
import { OrderService } from '../../service/order.service';

interface OrderDetail {
  id: number;
  totalAmount: number;
  orderDetails: any[];
  status: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  note?: string;
  orderDate?: Date;
}

interface PaymentDetail {
  id: number;
  paymentMethod: string;
  amount: number;
  transactionId: string;
  transactionStatus: string;
  bankCode?: string;
  paymentDate?: Date;
  order: OrderDetail;
}

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.scss']
})
export class PaymentResultComponent implements OnInit {
  paymentStatus: string = '';
  orderId: number = 0;
  orderDetail: OrderDetail | null = null;
  paymentDetail: PaymentDetail | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentStatus = params['status'] || '';
      this.orderId = +params['orderId'] || 0;
      
      if (this.orderId) {
        this.loadPaymentDetails();
      } else {
        this.loading = false;
      }
    });
  }

  loadPaymentDetails(): void {
    this.paymentService.getPaymentByOrderId(this.orderId).subscribe({
      next: (payment: PaymentDetail) => {
        this.paymentDetail = payment;
        this.loadOrderDetail();
      },
      error: (error: any) => {
        console.error('Error loading payment details:', error);
        this.loading = false;
      }
    });
  }

  loadOrderDetail(): void {
    this.orderService.getOrderDetail(this.orderId).subscribe({
      next: (data: OrderDetail) => {
        this.orderDetail = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading order detail:', error);
        this.loading = false;
      }
    });
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
} 