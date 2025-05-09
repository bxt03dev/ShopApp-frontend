import { Component, OnInit } from '@angular/core';
import {Product} from "../../model/product";
import {CartService} from "../../service/cart.service";
import {ProductService} from "../../service/product.service";
import {ApiResponse} from "../../dto/response/api.response";
import {environment} from "../../common/environment";
import {ActivatedRoute} from "@angular/router";
import {OrderService} from "../../service/order.service";

// Định nghĩa interface cho Order Detail
interface OrderDetail {
  id: number;
  userId?: number;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  note?: string;
  orderDate?: string;
  status: string;
  totalAmount?: number;
  shippingMethod?: string;
  shippingAddress?: string;
  shippingDate?: string;
  paymentMethod?: string;
  orderDetails?: any[];
  active?: boolean;
}

@Component({
  selector: 'app-order-confirm',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  cartItems: {product: Product, quantity: number}[] = [];
  totalPrice: number = 0;
  couponCode: string = '';
  orderDetail: OrderDetail | null = null;
  orderId: number = 0;
  
  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    console.log('OrderDetailComponent initialized');
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      if (params['id']) {
        this.orderId = +params['id'];
        console.log('Order ID from route:', this.orderId);
        this.loadOrderDetails();
      }
    });
    
    const cart = this.cartService.getCart();
    const productIds = Array.from(cart.keys());
    console.log('Cart product IDs:', productIds);

    this.productService.getProductsByIds(productIds).subscribe({
      next: (products: ApiResponse<Product[]>) => {
        console.log('Products loaded:', products);
        this.cartItems = productIds.map((productId: number) => {
          const product = products.result.find((p) => p.id === productId);
          if (product) {
            product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
            return {
              product: product,
              quantity: cart.get(productId)!
            };
          }
          return null; // Hoặc xử lý khi không tìm thấy sản phẩm
        }).filter(item => item !== null) as { product: Product; quantity: number }[];
        console.log('Cart items mapped:', this.cartItems);
      },
      complete: () => {
        this.calculateTotalPrice();
        console.log('Total price calculated:', this.totalPrice);
      },
      error: (error: any) => {
        console.error('Error fetching product details:', error);
      }
    });
  }

  loadOrderDetails(): void {
    console.log('Loading order details for order ID:', this.orderId);
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (data: OrderDetail) => {
        this.orderDetail = data;
        console.log('Order details loaded:', this.orderDetail);
        console.log('Order status:', this.orderDetail?.status);
        
        // Debug: Kiểm tra xem trạng thái đơn hàng có phải là PENDING không
        if (this.orderDetail?.status === 'PENDING') {
          console.log('Order is in PENDING status, payment button should be visible');
        } else {
          console.log('Order is NOT in PENDING status, payment button will not be visible');
        }
      },
      error: (error: any) => {
        console.error('Error loading order details:', error);
      }
    });
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }
  
  // Thêm phương thức để gỡ lỗi
  goToPayment(): void {
    console.log('Navigating to payment for order ID:', this.orderId);
    // Navigation handled by routerLink in template
  }
}
