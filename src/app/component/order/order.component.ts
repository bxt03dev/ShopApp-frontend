import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Product} from "../../model/product";
import {CartService} from "../../service/cart.service";
import {ProductService} from "../../service/product.service";
import {OrderDTO} from "../../dto/user/order.dto";
import {FooterComponent} from "../footer/footer.component";
import {HeaderComponent} from "../header/header.component";
import {CommonModule} from "@angular/common";
import {OrderService} from "../../service/order.service";
import {Order} from "../../model/order";
import {environment} from "../../common/environment";
import {Router} from "@angular/router";
import {TokenService} from "../../service/token.service";
import {CouponService} from "../../service/coupon.service";
import {CustomToastService} from "../../service/custom-toast.service";
import {PaymentService, PaymentDTO} from "../../service/payment.service";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  orderForm: FormGroup;
  cartItems: { product: Product, quantity: number }[] = [];
  couponCode: string = '';
  totalMoney: number = 0;
  cart: Map<number, number> = new Map();
  createdOrderId: number = 0;

  orderData: OrderDTO = {
    userId: 2,
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    note: '',
    totalMoney: 0,
    paymentMethod: 'cod',
    shippingMethod: 'express',
    couponCode: '',
    cartItems: []
  };

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router,
    private fb: FormBuilder,
    private customToast: CustomToastService
  ) {
    this.orderForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.minLength(8)]],
      address: ['', Validators.required],
      note: [''],
      shippingMethod: ['express'],
      paymentMethod: ['cod'],
      couponCode: ['']
    });
  }

  ngOnInit(): void {
    this.loadCartItems();
  }

  loadCartItems(): void {
    this.cart = this.cartService.getCart();
    const productIds = Array.from(this.cart.keys());

    if (productIds.length === 0) {
      return;
    }

    this.productService.getProductsByIds(productIds).subscribe({
      next: (products) => {
        if (products.result) {
          this.cartItems = productIds
            .map(productId => {
              const product = products.result.find((p: Product) => p.id === productId);
              if (product) {
                product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
                
                // Kiểm tra nếu số lượng trong giỏ hàng lớn hơn số lượng có sẵn
                const cartQuantity = this.cart.get(productId) || 0;
                if (product.quantity != null && cartQuantity > product.quantity) {
                  // Điều chỉnh số lượng trong giỏ hàng không vượt quá số lượng có sẵn
                  this.cart.set(productId, product.quantity);
                  this.customToast.showWarning(`Số lượng sản phẩm "${product.name}" đã được điều chỉnh còn ${product.quantity} (số lượng tối đa có sẵn).`, 'Thông báo');
                }
                
                return {
                  product: product,
                  quantity: this.cart.get(productId) || 0
                };
              }
              return null;
            })
            .filter((item): item is { product: Product; quantity: number } => item !== null);

          this.cartService.setCart(this.cart); // Lưu lại giỏ hàng sau khi điều chỉnh
          this.calculateTotal();
        }
      },
      error: (error: any) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  placeOrder() {
    if (this.orderForm.valid) {
      // Kiểm tra lại số lượng trước khi đặt hàng
      let hasInsufficientStock = false;
      this.cartItems.forEach(item => {
        if (item.product.quantity != null && item.quantity > item.product.quantity) {
          this.customToast.showError(`Không đủ số lượng cho sản phẩm "${item.product.name}". Chỉ còn ${item.product.quantity} sản phẩm.`, 'Lỗi');
          hasInsufficientStock = true;
        }
      });
      
      if (hasInsufficientStock) {
        return;
      }
      
      const formValue = this.orderForm.value;
      this.orderData = {
        ...this.orderData,
        ...formValue,
        cartItems: this.cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        totalMoney: this.totalMoney
      };

      // Lấy phương thức thanh toán
      const paymentMethod = this.orderForm.get('paymentMethod')?.value;

      console.log('Đang gửi dữ liệu đặt hàng:', JSON.stringify(this.orderData));

      this.orderService.placeOrder(this.orderData).subscribe({
        next: (response) => {
          console.log('Đặt hàng thành công, phản hồi đầy đủ:', JSON.stringify(response));
          
          // Debug: log cấu trúc của response để xác định cách lấy ID
          console.log('Kiểu dữ liệu của response:', typeof response);
          console.log('Các thuộc tính của response:', Object.keys(response));
          
          // Kiểm tra chi tiết hơn
          let orderId = null;
          
          if (response && typeof response === 'object') {
            if ('id' in response) {
              orderId = response.id;
              console.log('Tìm thấy ID trực tiếp trong response:', orderId);
            } else if ('result' in response && response.result && typeof response.result === 'object') {
              console.log('Đang kiểm tra result:', response.result);
              console.log('Các thuộc tính của result:', Object.keys(response.result));
              
              if ('id' in response.result) {
                orderId = response.result.id;
                console.log('Tìm thấy ID trong response.result:', orderId);
              }
            }
          }
          
          if (orderId === null || orderId === undefined) {
            console.error('Không thể tìm thấy ID đơn hàng trong phản hồi:', response);
            this.customToast.showError('Không thể xác định mã đơn hàng', 'Lỗi');
            return;
          }
          
          this.createdOrderId = orderId;
          console.log('ĐÃ XÁC ĐỊNH ĐƯỢC ID ĐƠN HÀNG:', this.createdOrderId);
          
          this.cartService.clearCart();
          this.loadCartItems();
          
          // Kiểm tra phương thức thanh toán
          if (paymentMethod === 'vnpay') {
            // Không hiển thị thông báo đặt hàng thành công nếu thanh toán VNPay
            // vì đã có thông báo trong processVNPayPayment
            console.log('Chuyển sang thanh toán VNPay với orderId:', this.createdOrderId, 'và số tiền:', this.totalMoney);
            this.processVNPayPayment(this.createdOrderId, this.totalMoney);
          } else {
            // Thanh toán COD hoặc phương thức khác
            this.customToast.showSuccess('Đặt hàng thành công!', 'Thông báo');
            this.router.navigate(['/']);
          }
        },
        error: (error: any) => {
          console.error('Lỗi khi đặt hàng:', error);
          
          // Kiểm tra nếu lỗi do không đủ số lượng
          if (error.error && error.error.result && Array.isArray(error.error.result)) {
            error.error.result.forEach((errorMsg: string) => {
              this.customToast.showError(errorMsg, 'Lỗi số lượng');
            });
          } else {
            this.customToast.showError(`Lỗi khi đặt hàng: ${error.message || 'Lỗi không xác định'}`, 'Lỗi');
          }
        }
      });
    } else {
      this.customToast.showWarning('Vui lòng điền đầy đủ thông tin bắt buộc.', 'Cảnh báo');
    }
  }

  // Phương thức xử lý thanh toán VNPay
  processVNPayPayment(orderId: number, amount: number): void {
    // Xóa tất cả thông báo hiện có
    this.customToast.clear();
    
    // Hiển thị một thông báo đang xử lý
    this.customToast.showInfo('Đang kết nối đến cổng thanh toán VNPay...', 'Đang xử lý');
    
    // Kiểm tra và đảm bảo orderId là số hợp lệ
    if (!orderId || isNaN(Number(orderId)) || Number(orderId) <= 0) {
      console.error('Mã đơn hàng không hợp lệ. OrderId:', orderId, 'Kiểu:', typeof orderId);
      this.customToast.clear();
      this.customToast.showError('Mã đơn hàng không hợp lệ. Vui lòng thử lại.', 'Lỗi');
      return;
    }
    
    // Đảm bảo amount là số hợp lệ
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      console.error('Số tiền thanh toán không hợp lệ. Amount:', amount, 'Kiểu:', typeof amount);
      this.customToast.clear();
      this.customToast.showError('Số tiền thanh toán không hợp lệ.', 'Lỗi');
      return;
    }
    
    // Convert sang kiểu số rõ ràng
    const numericOrderId = Number(orderId);
    const numericAmount = Number(amount);
    
    // Log thông tin debug
    console.log('Đang tạo yêu cầu thanh toán VNPay với dữ liệu:', {
      order_id: numericOrderId,
      payment_method: 'VNPAY',
      amount: numericAmount
    });
    console.log('API Base URL:', environment.apiBaseUrl);
    console.log('API endpoint:', `${environment.apiBaseUrl}/payments/create`);
    
    // Tạo raw object thay vì sử dụng interface để đảm bảo đúng định dạng
    const rawPaymentData = {
      order_id: numericOrderId,
      payment_method: 'VNPAY',
      amount: numericAmount
    };
    
    console.log('Dữ liệu gửi đi:', JSON.stringify(rawPaymentData));
    
    try {
      this.paymentService.createPayment(rawPaymentData as PaymentDTO).subscribe({
        next: (response) => {
          console.log('Nhận phản hồi từ API thanh toán:', response);
          if (response && response.payment_url) {
            // Xóa thông báo đang xử lý
            this.customToast.clear();
            
            // Chuyển hướng đến URL thanh toán
            console.log('Đang chuyển hướng đến URL thanh toán:', response.payment_url);
            window.location.href = response.payment_url;
          } else {
            console.error('URL thanh toán không tồn tại trong phản hồi:', response);
            
            // Xóa thông báo đang xử lý trước khi hiển thị thông báo lỗi
            this.customToast.clear();
            this.customToast.showError('Không nhận được URL thanh toán từ máy chủ.', 'Lỗi');
            
            // Chuyển hướng về trang đơn hàng sau 3 giây
            setTimeout(() => {
              this.router.navigate(['/orders']);
            }, 3000);
          }
        },
        error: (error) => {
          console.error('Chi tiết lỗi khi tạo thanh toán VNPay:', error);
          
          // Xóa thông báo hiện có trước khi hiển thị lỗi
          this.customToast.clear();
          
          let errorMessage = 'Không thể kết nối đến cổng thanh toán VNPay. Vui lòng thử lại sau.';
          
          // Hiển thị thông báo lỗi chi tiết hơn
          if (error.status === 0) {
            errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và máy chủ backend.';
            console.error('Lỗi kết nối: Backend server không chạy hoặc đang chạy trên port khác. URL đang dùng:', environment.apiBaseUrl);
          } else if (error.status === 404) {
            errorMessage = 'API thanh toán không tồn tại. Vui lòng kiểm tra cấu hình backend.';
            console.error('Lỗi 404: Endpoint không tồn tại:', `${environment.apiBaseUrl}/payments/create`);
          } else if (error.status === 403) {
            errorMessage = 'Không có quyền truy cập API thanh toán. Vui lòng kiểm tra xác thực.';
            console.error('Lỗi 403: Forbidden. Có thể do thiếu token hoặc không có quyền truy cập.');
          } else if (error.error && error.error.message) {
            errorMessage = `Lỗi từ máy chủ: ${error.error.message}`;
          }
          
          // Hiển thị một thông báo lỗi duy nhất
          this.customToast.showError(errorMessage, 'Lỗi');
          
          // Chuyển hướng người dùng về trang đơn hàng
          setTimeout(() => {
            this.router.navigate(['/orders']);
          }, 3000);
        }
      });
    } catch (e) {
      console.error('Lỗi không mong đợi:', e);
      this.customToast.clear();
      this.customToast.showError('Đã xảy ra lỗi không mong đợi khi xử lý thanh toán.', 'Lỗi');
    }
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateCartFromCartItems();
    }
  }

  increaseQuantity(index: number): void {
    const item = this.cartItems[index];
    
    // Kiểm tra nếu số lượng hiện tại đã đạt tối đa
    if (item.product.quantity != null && item.quantity >= item.product.quantity) {
      this.customToast.showWarning(`Không thể thêm. Sản phẩm "${item.product.name}" chỉ còn ${item.product.quantity} sản phẩm trong kho.`, 'Thông báo');
      return;
    }
    
    item.quantity++;
    this.updateCartFromCartItems();
  }

  calculateTotal(): void {
    this.totalMoney = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  confirmDelete(index: number): void {
    const product = this.cartItems[index].product;
    
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: `Bạn muốn xóa sản phẩm "${product.name}" khỏi giỏ hàng?`,
      imageUrl: product.thumbnail,
      imageWidth: 100,
      imageHeight: 100,
      imageAlt: product.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Xóa sản phẩm khỏi giỏ hàng
        this.cartItems.splice(index, 1);
        this.updateCartFromCartItems();
        
        // Hiển thị thông báo xóa thành công
        Swal.fire(
          'Đã xóa!',
          `Sản phẩm "${product.name}" đã được xóa khỏi giỏ hàng.`,
          'success'
        );
      }
    });
  }

  private updateCartFromCartItems(): void {
    this.cart.clear();
    this.cartItems.forEach(item => {
      this.cart.set(item.product.id, item.quantity);
    });
    this.cartService.setCart(this.cart);
    this.calculateTotal();
  }
}
