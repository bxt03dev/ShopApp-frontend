import { Component, OnInit } from '@angular/core';
import {Product} from "../../model/product";
import {CartService} from "../../service/cart.service";
import {ProductService} from "../../service/product.service";
import {ApiResponse} from "../../dto/response/api.response";
import {environment} from "../../common/environment";
import {ActivatedRoute, Router} from "@angular/router";
import {OrderService} from "../../service/order.service";
import {CustomToastService} from '../../service/custom-toast.service';
import {Order} from "../../model/order";
import {OrderDetail as OrderDetailModel} from "../../model/order.detail";

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
  warrantyCode?: string;
  warrantyDate?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  couponCode: string = '';
  couponMessage: string = '';
  discountAmount: number = 0;
  orderDetail: OrderDetail | null = null;
  orderId: number = 0;
  isGeneratingWarranty: boolean = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastService: CustomToastService
  ) { }

  ngOnInit(): void {
    console.log('OrderDetailComponent initialized');
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      if (params['id']) {
        this.orderId = +params['id'];
        console.log('Order ID from route:', this.orderId);
        // Only load order details if we have a valid order ID
        if (this.orderId > 0) {
          this.loadOrderDetails();
        }
      }
    });

    // Always load cart items
    this.loadCartItems();
  }

  loadOrderDetails(): void {
    if (!this.orderId || this.orderId <= 0) {
      console.log('Invalid or missing order ID, skipping order details load');
      return;
    }

    console.log('Loading order details for order ID:', this.orderId);
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (response: any) => {
        console.log('Raw order details response:', response);

        // Xử lý dữ liệu trả về từ API
        let orderData = response;

        // Kiểm tra xem response có phải là ApiResponse format không
        if (response && response.result) {
          console.log('Response contains result property, extracting data');
          orderData = response.result;
        }

        this.orderDetail = orderData;
        console.log('Parsed order details:', this.orderDetail);
        console.log('Order status:', this.orderDetail?.status);

        if (this.orderDetail && this.orderDetail.orderDetails) {
          console.log('Order items:', this.orderDetail.orderDetails.length);

          // Xử lý hình ảnh sản phẩm nếu có
          this.orderDetail.orderDetails.forEach(item => {
            if (item.product && item.product.thumbnail) {
              item.product.thumbnail = this.getProductImageUrl(item.product.thumbnail);
            }
          });

          // Đảm bảo totalAmount có giá trị
          if (!this.orderDetail.totalAmount || this.orderDetail.totalAmount === 0) {
            console.log('totalAmount is missing or zero, calculating it');
            // Đợi một tick để đảm bảo các thành phần đã được khởi tạo
            setTimeout(() => {
              // Tính tổng tiền từ subtotal và phí vận chuyển
              this.orderDetail!.totalAmount = this.calculateTotalAmount();
              console.log('Calculated totalAmount:', this.orderDetail!.totalAmount);
            }, 0);
          }
        } else {
          console.log('No order items found in the response');
        }

        // Debug: Kiểm tra xem trạng thái đơn hàng có phải là PENDING không
        if (this.orderDetail?.status === 'PENDING') {
          console.log('Order is in PENDING status, payment button should be visible');
        } else {
          console.log('Order is NOT in PENDING status, payment button will not be visible');
        }
      },
      error: (error: any) => {
        console.error('Error loading order details:', error);

        // Only show the error toast if we're on an order detail page (with orderId)
        if (this.orderId > 0) {
          this.toastService.showError('Không thể tải thông tin đơn hàng', 'Lỗi');
        }
      }
    });
  }

  loadCartItems(): void {
    const cart = this.cartService.getCart();
    const productIds = Array.from(cart.keys());

    if (productIds.length === 0) {
      return;
    }

    this.productService.getProductsByIds(productIds).subscribe({
      next: (products: ApiResponse<Product[]>) => {
        this.cartItems = productIds.map((productId: number) => {
          const product = products.result.find((p) => p.id === productId);
          if (product) {
            product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
            return {
              product: product,
              quantity: cart.get(productId)!,
              selected: true // Default all items selected
            };
          }
          return null; // Handle if product not found
        }).filter(item => item !== null) as CartItem[];
      },
      error: (error: any) => {
        console.error('Error fetching product details:', error);
        this.toastService.showError('Không thể tải thông tin sản phẩm', 'Lỗi');
      }
    });
  }

  // Selection methods
  areAllItemsSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
  }

  toggleSelectAll(): void {
    const newValue = !this.areAllItemsSelected();
    this.cartItems.forEach(item => item.selected = newValue);
  }

  updateSelection(): void {
    // This is called when individual items are selected/deselected
    // You can add additional logic here if needed
  }

  // Quantity adjustment methods
  increaseQuantity(index: number): void {
    const item = this.cartItems[index];
    if (item.product.quantity && item.quantity >= item.product.quantity) {
      this.toastService.showWarning(`Chỉ còn ${item.product.quantity} sản phẩm trong kho`, 'Thông báo');
      return;
    }
    item.quantity++;
    this.updateCartQuantity(item.product.id, item.quantity);
  }

  decreaseQuantity(index: number): void {
    const item = this.cartItems[index];
    if (item.quantity > 1) {
      item.quantity--;
      this.updateCartQuantity(item.product.id, item.quantity);
    }
  }

  updateQuantity(index: number): void {
    const item = this.cartItems[index];
    // Ensure quantity is at least 1
    if (item.quantity < 1) {
      item.quantity = 1;
    }
    // Ensure quantity doesn't exceed available stock
    if (item.product.quantity && item.quantity > item.product.quantity) {
      item.quantity = item.product.quantity;
      this.toastService.showWarning(`Chỉ còn ${item.product.quantity} sản phẩm trong kho`, 'Thông báo');
    }
    this.updateCartQuantity(item.product.id, item.quantity);
  }

  private updateCartQuantity(productId: number, quantity: number): void {
    const cart = this.cartService.getCart();
    cart.set(productId, quantity);
    this.cartService.setCart(cart);
  }

  // Remove item method
  removeItem(productId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      const success = this.cartService.removeFromCart(productId);
      if (success) {
        this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
        this.toastService.showSuccess('Đã xóa sản phẩm khỏi giỏ hàng', 'Thành công');
      } else {
        this.toastService.showError('Không thể xóa sản phẩm', 'Lỗi');
      }
    }
  }

  // Calculation methods
  getSelectedItemsCount(): number {
    return this.cartItems.filter(item => item.selected).length;
  }

  getSelectedTotal(): number {
    return this.cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  getFinalTotal(): number {
    return Math.max(0, this.getSelectedTotal() - this.discountAmount);
  }


  // Checkout method
  checkout(): void {
    if (this.getSelectedItemsCount() === 0) {
      this.toastService.showWarning('Vui lòng chọn ít nhất một sản phẩm để thanh toán', 'Thông báo');
      return;
    }

    // Create a temporary cart for checkout with only selected items
    // But don't modify the original cart
    const checkoutCart = new Map<number, number>();
    this.cartItems.forEach(item => {
      if (item.selected) {
        checkoutCart.set(item.product.id, item.quantity);
      }
    });

    // Store the checkout cart in sessionStorage for the checkout process
    sessionStorage.setItem('checkout_cart', JSON.stringify(Array.from(checkoutCart.entries())));

    // Create a flag in sessionStorage to indicate we're using a temporary cart
    sessionStorage.setItem('using_temp_cart', 'true');

    // Navigate to order page
    this.router.navigate(['/orders']);
  }

  // Add currency formatting method
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Order detail specific methods
  getStatusText(status: string | undefined): string {
    if (!status) return 'Không xác định';

    const statusMap: {[key: string]: string} = {
      'PENDING': 'Chờ xác nhận',
      'PROCESSING': 'Đang xử lý',
      'SHIPPING': 'Đang giao hàng',
      'COMPLETED': 'Đã hoàn thành',
      'CANCELLED': 'Đã hủy'
    };

    return statusMap[status] || status;
  }

  getPaymentMethodText(method: string | undefined): string {
    if (!method) return 'Không xác định';

    const methodMap: {[key: string]: string} = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
      'vnpay': 'Thanh toán qua VNPay',
      'momo': 'Thanh toán qua MoMo',
      'bank_transfer': 'Chuyển khoản ngân hàng'
    };

    return methodMap[method] || method;
  }

  getShippingMethodText(method: string | undefined): string {
    if (!method) return 'Không xác định';

    const methodMap: {[key: string]: string} = {
      'standard': 'Giao hàng tiêu chuẩn',
      'express': 'Giao hàng nhanh',
      'same_day': 'Giao hàng trong ngày'
    };

    return methodMap[method] || method;
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Không xác định';

    const dateObj = new Date(date);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  getProductImageUrl(thumbnail: string): string {
    if (!thumbnail) return 'assets/images/placeholder.jpg';

    // Check if it's already a full URL
    if (thumbnail.startsWith('http')) {
      return thumbnail;
    }

    return `${environment.apiBaseUrl}/products/images/${thumbnail}`;
  }

  calculateSubtotal(): number {
    if (!this.orderDetail || !this.orderDetail.orderDetails) return 0;

    return this.orderDetail.orderDetails.reduce((total, item) => {
      return total + ((item.price || 0) * (item.numberOfProducts || 0));
    }, 0);
  }

  getShippingCost(): number {
    // In a real app, this would come from the order data
    // For demo purposes, we'll use fixed values based on shipping method
    if (!this.orderDetail) return 0;

    const shippingMethod = this.orderDetail.shippingMethod || '';

    const shippingCosts: {[key: string]: number} = {
      'standard': 15000,
      'express': 30000,
      'same_day': 50000
    };

    return shippingCosts[shippingMethod] || 0;
  }

  // Thêm phương thức tính tổng tiền
  calculateTotalAmount(): number {
    const subtotal = this.calculateSubtotal();
    const shippingCost = this.getShippingCost();
    const discount = this.discountAmount || 0;
    return subtotal + shippingCost - discount;
  }

  navigateBack(): void {
    this.router.navigate(['/order-history']);
  }

  cancelOrder(): void {
    if (!this.orderDetail || !this.orderDetail.id) return;

    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      this.orderService.cancelOrder(this.orderDetail.id).subscribe({
        next: () => {
          this.toastService.showSuccess('Đã hủy đơn hàng thành công', 'Thành công');
          this.loadOrderDetails(); // Reload order details
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.toastService.showError('Không thể hủy đơn hàng', 'Lỗi');
        }
      });
    }
  }

  // Warranty code methods
  generateWarrantyCode(): void {
    if (!this.orderDetail || !this.orderDetail.id) return;

    this.isGeneratingWarranty = true;
    this.orderService.generateWarrantyCode(this.orderDetail.id).subscribe({
      next: (response) => {
        this.isGeneratingWarranty = false;
        if (response && response.warrantyCode) {
          this.orderDetail!.warrantyCode = response.warrantyCode;
          this.toastService.showSuccess('Đã tạo mã bảo hành thành công', 'Thành công');
        } else {
          this.toastService.showError('Không thể tạo mã bảo hành', 'Lỗi');
        }
      },
      error: (error) => {
        this.isGeneratingWarranty = false;
        console.error('Error generating warranty code:', error);
        this.toastService.showError('Không thể tạo mã bảo hành', 'Lỗi');
      }
    });
  }

  copyWarrantyCode(): void {
    if (!this.orderDetail || !this.orderDetail.warrantyCode) return;

    // Simple fallback method using DOM clipboard API
    try {
      const textArea = document.createElement('textarea');
      textArea.value = this.orderDetail.warrantyCode;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        this.toastService.showSuccess('Đã sao chép mã bảo hành', 'Thành công');
      } else {
        this.toastService.showError('Không thể sao chép mã bảo hành', 'Lỗi');
      }
    } catch (err) {
      console.error('Could not copy text: ', err);
      this.toastService.showError('Không thể sao chép mã bảo hành', 'Lỗi');
    }
  }

  getWarrantyExpirationDate(warrantyDate: string | undefined): Date | null {
    if (!warrantyDate) return null;
    const date = new Date(warrantyDate);
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }
}
