import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../service/order.service';
import { PaymentService, PaymentDTO } from '../../service/payment.service';

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
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  orderId: number = 0;
  orderDetail: OrderDetail | null = null;
  selectedPaymentMethod: string = 'VNPAY';
  paymentLoading: boolean = false;
  paymentMethods = [
    { id: 'VNPAY', name: 'VNPay' },
    { id: 'COD', name: 'Thanh toán khi nhận hàng' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      this.loadOrderDetail();
    });
  }

  loadOrderDetail(): void {
    this.orderService.getOrderDetail(this.orderId).subscribe({
      next: (data: OrderDetail) => {
        this.orderDetail = data;
      },
      error: (error: any) => {
        console.error('Error loading order detail:', error);
      }
    });
  }

  processPayment(): void {
    if (this.selectedPaymentMethod === 'COD') {
      // Xử lý thanh toán COD
      this.router.navigate(['/payment-success', this.orderId]);
      return;
    }

    this.paymentLoading = true;
    const paymentData: PaymentDTO = {
      order_id: this.orderId,
      payment_method: this.selectedPaymentMethod,
      amount: this.orderDetail?.totalAmount || 0
    };

    this.paymentService.createPayment(paymentData).subscribe({
      next: (response: {payment_url: string}) => {
        this.paymentLoading = false;
        // Chuyển hướng đến trang thanh toán của VNPay
        window.location.href = response.payment_url;
      },
      error: (error: any) => {
        this.paymentLoading = false;
        console.error('Payment error:', error);
      }
    });
  }
} 