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
  discountAmount: number = 0;
  errorMessage: string = '';
  isProcessing: boolean = false;

  orderData: OrderDTO = {
    userId: 0,
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
    private customToast: CustomToastService,
    private tokenService: TokenService
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
    // Check if we have a checkout cart in sessionStorage
    const checkoutCartJson = sessionStorage.getItem('checkout_cart');
    if (checkoutCartJson) {
      // Use the checkout cart from sessionStorage
      this.cart = new Map(JSON.parse(checkoutCartJson));
      console.log('Using checkout cart from sessionStorage');
      
      // Keep the checkout cart in sessionStorage until the order is placed
      // Do NOT remove it here
    } else {
      // Use the regular cart if no checkout cart is available
      this.cart = this.cartService.getCart();
      console.log('Using regular cart from CartService');
    }
    
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
          
          // Lắng nghe sự thay đổi của phương thức vận chuyển để cập nhật tổng tiền
          this.orderForm.get('shippingMethod')?.valueChanges.subscribe(() => {
            // Cập nhật lại tổng tiền khi thay đổi phương thức vận chuyển
            this.updateOrderTotal();
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  placeOrder() {
    if (this.isProcessing) {
      this.showError('Đơn hàng của bạn đang được xử lý, vui lòng chờ một lát.');
      return;
    }
    
    // Check authentication first
    const token = this.tokenService.getToken();
    if (!token) {
      this.showError('Bạn cần đăng nhập để đặt hàng');
      this.customToast.showError('Bạn cần đăng nhập để đặt hàng', 'Lỗi xác thực');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/order' } });
      }, 2000);
      return;
    }
    
    // Check if token is expired
    if (this.tokenService.isTokenExpired()) {
      this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      this.customToast.showError('Phiên đăng nhập đã hết hạn', 'Lỗi xác thực');
      this.tokenService.removeToken(); // Clear the expired token
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/order' } });
      }, 2000);
      return;
    }
    
    if (this.orderForm.invalid) {
      this.showError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      this.customToast.showWarning('Vui lòng điền đầy đủ thông tin bắt buộc.', 'Cảnh báo');
      
      // Mark all fields as touched to show validation errors
      Object.keys(this.orderForm.controls).forEach(key => {
        const control = this.orderForm.get(key);
        control?.markAsTouched();
      });
      
      return;
    }
    
    // Kiểm tra nếu giỏ hàng trống
    if (this.cartItems.length === 0) {
      this.showError('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ hàng.');
      return;
    }

    // Kiểm tra lại số lượng trước khi đặt hàng
    let hasInsufficientStock = false;
    this.cartItems.forEach(item => {
      if (item.product.quantity != null && item.quantity > item.product.quantity) {
        this.customToast.showError(`Không đủ số lượng cho sản phẩm "${item.product.name}". Chỉ còn ${item.product.quantity} sản phẩm.`, 'Lỗi');
        hasInsufficientStock = true;
      }
    });
    
    if (hasInsufficientStock) {
      this.showError('Một số sản phẩm trong giỏ hàng không đủ số lượng trong kho.');
      return;
    }
    
    // Lấy ID người dùng từ token
    const userId = this.tokenService.getUserId();
    if (!userId) {
      this.showError('Không thể xác định ID người dùng. Vui lòng đăng nhập lại.');
      this.customToast.showError('Không thể xác định ID người dùng', 'Lỗi');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }
    
    const formValue = this.orderForm.value;
    
    // Tạo đối tượng đơn hàng với dữ liệu đúng
    this.orderData = {
      userId: userId,
      fullName: formValue.fullName || '',
      email: formValue.email || '',
      phoneNumber: formValue.phoneNumber || '',
      address: formValue.address || '',
      note: formValue.note || '',
      totalMoney: this.getFinalTotal(), // Sử dụng tổng tiền đã bao gồm phí vận chuyển
      paymentMethod: formValue.paymentMethod || 'cod',
      shippingMethod: formValue.shippingMethod || 'express',
      couponCode: formValue.couponCode || '',
      cartItems: this.cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    // Lấy phương thức thanh toán
    const paymentMethod = this.orderForm.get('paymentMethod')?.value;

    console.log('Đang gửi dữ liệu đặt hàng:', JSON.stringify(this.orderData));
    
    // Set processing flag
    this.isProcessing = true;
    
    // Show loading message
    this.customToast.showInfo('Đang xử lý đơn hàng của bạn...', 'Xin chờ');

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
          this.showError('Không thể xác định mã đơn hàng. Vui lòng liên hệ bộ phận hỗ trợ.');
          this.isProcessing = false;
          return;
        }
        
        this.createdOrderId = orderId;
        console.log('ĐÃ XÁC ĐỊNH ĐƯỢC ID ĐƠN HÀNG:', this.createdOrderId);
        
        // Check if we're using a temporary cart
        const usingTempCart = sessionStorage.getItem('using_temp_cart') === 'true';
        
        if (usingTempCart) {
          console.log('Using temporary cart - only removing checked out items');
          // Get the current full cart
          const fullCart = this.cartService.getCart();
          
          // Get the items that were checked out
          const checkoutItems = new Set(Array.from(this.cart.keys()));
          
          // Remove only the checked out items from the full cart
          checkoutItems.forEach(productId => {
            fullCart.delete(productId);
          });
          
          // Update the cart with the remaining items
          this.cartService.setCart(fullCart);
          
          // Clear the temporary cart flags
          sessionStorage.removeItem('checkout_cart');
          sessionStorage.removeItem('using_temp_cart');
        } else {
          console.log('Using full cart - clearing entire cart');
          // Clear the entire cart if we're not using a temporary cart
          this.cartService.clearCart();
        }
        
        // Reload cart items to reflect changes
        this.loadCartItems();
        
        // Kiểm tra phương thức thanh toán
        if (paymentMethod === 'vnpay') {
          // Không hiển thị thông báo đặt hàng thành công nếu thanh toán VNPay
          // vì đã có thông báo trong processVNPayPayment
          console.log('Chuyển sang thanh toán VNPay với orderId:', this.createdOrderId, 'và số tiền:', this.getFinalTotal());
          this.processVNPayPayment(this.createdOrderId, this.getFinalTotal());
        } else {
          // Reset processing flag
          this.isProcessing = false;
          
          // Thanh toán COD hoặc phương thức khác
          this.customToast.showSuccess('Đặt hàng thành công!', 'Thông báo');
          this.router.navigate(['/']);
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi đặt hàng:', error);
        
        // Reset processing flag
        this.isProcessing = false;
        
        // Hiển thị chi tiết lỗi nếu có
        if (error.status === 403) {
          this.tokenService.removeToken(); // Xóa token có thể đã hết hạn
          this.showError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
          this.customToast.showError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ', 'Lỗi xác thực');
          setTimeout(() => {
            this.router.navigate(['/login'], { queryParams: { returnUrl: '/order' } });
          }, 2000);
        } else if (error.error && error.error.message) {
          this.showError(`Lỗi: ${error.error.message}`);
          this.customToast.showError(`Lỗi: ${error.error.message}`, 'Đặt hàng thất bại');
        } else if (error.error && error.error.result && Array.isArray(error.error.result)) {
          const errorMessages = error.error.result.join('. ');
          this.showError(`Lỗi: ${errorMessages}`);
          error.error.result.forEach((errorMsg: string) => {
            this.customToast.showError(errorMsg, 'Lỗi số lượng');
          });
        } else {
          this.showError(`Lỗi khi đặt hàng: ${error.message || 'Lỗi không xác định'}`);
          this.customToast.showError(`Lỗi khi đặt hàng: ${error.message || 'Lỗi không xác định'}`, 'Lỗi');
        }
      }
    });
  }

  // Phương thức xử lý thanh toán VNPay
  processVNPayPayment(orderId: number, amount: number): void {
    // Xóa tất cả thông báo hiện có
    this.customToast.clear();
    
    // Hiển thị một thông báo đang xử lý
    this.customToast.showInfo('Đang kết nối đến cổng thanh toán VNPay...', 'Đang xử lý');
    
    // Kiểm tra xác thực
    const token = this.tokenService.getToken();
    if (!token) {
      this.customToast.clear();
      this.customToast.showError('Bạn cần đăng nhập để thanh toán', 'Lỗi xác thực');
      this.showError('Bạn cần đăng nhập để thanh toán');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/order' } });
      }, 2000);
      return;
    }
    
    // Kiểm tra token hết hạn
    if (this.tokenService.isTokenExpired()) {
      this.customToast.clear();
      this.customToast.showError('Phiên đăng nhập đã hết hạn', 'Lỗi xác thực');
      this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      this.tokenService.removeToken();
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/order' } });
      }, 2000);
      return;
    }
    
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
    console.log('Token hiện tại:', token ? token.substring(0, 15) + '...' : 'Không có');
    
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
            
            // Đảm bảo URL là chuỗi hợp lệ
            if (typeof response.payment_url !== 'string' || !response.payment_url.startsWith('http')) {
              console.error('URL thanh toán không hợp lệ:', response.payment_url);
              this.customToast.showError('URL thanh toán không hợp lệ', 'Lỗi');
              return;
            }
            
            // Chuyển hướng đến trang thanh toán VNPay
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
            errorMessage = 'Không có quyền truy cập API thanh toán. Vui lòng đăng nhập lại.';
            console.error('Lỗi 403: Forbidden. Có thể do thiếu token hoặc không có quyền truy cập.');
            
            // Chuyển hướng đến trang đăng nhập
            this.tokenService.removeToken();
            setTimeout(() => {
              this.router.navigate(['/login'], { queryParams: { returnUrl: '/order' } });
            }, 3000);
          } else if (error.error && error.error.message) {
            errorMessage = `Lỗi từ máy chủ: ${error.error.message}`;
          }
          
          // Hiển thị một thông báo lỗi duy nhất
          this.customToast.showError(errorMessage, 'Lỗi');
          
          // Hiển thị thông báo lỗi trong page
          this.showError(errorMessage);
          
          // Chuyển hướng người dùng về trang đơn hàng (trừ trường hợp lỗi xác thực)
          if (error.status !== 403 && error.status !== 401) {
            setTimeout(() => {
              this.router.navigate(['/orders']);
            }, 3000);
          }
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
    // Cập nhật tổng tiền cho đơn hàng
    this.updateOrderTotal();
  }
  
  // Phương thức mới để cập nhật tổng tiền cho đơn hàng, bao gồm phí vận chuyển
  updateOrderTotal(): void {
    if (this.orderData) {
      // Cập nhật tổng tiền cho đơn hàng, bao gồm phí vận chuyển
      this.orderData.totalMoney = this.getFinalTotal();
    }
  }

  getShippingCost(): number {
    const shippingMethod = this.orderForm.get('shippingMethod')?.value;
    return shippingMethod === 'express' ? 30000 : 15000;
  }

  getFinalTotal(): number {
    return this.totalMoney + this.getShippingCost() - this.discountAmount;
  }

  // Phương thức xử lý mã giảm giá
  applyCoupon(): void {
    const couponCode = this.orderForm.get('couponCode')?.value;
    if (!couponCode) {
      this.customToast.showWarning('Vui lòng nhập mã giảm giá', 'Thông báo');
      return;
    }
    
    // Giả lập việc áp dụng mã giảm giá (trong thực tế sẽ gọi API)
    // Để demo, giả sử mã "GIAMGIA10" sẽ giảm 10% tổng giá trị đơn hàng
    if (couponCode === 'GIAMGIA10') {
      this.discountAmount = this.totalMoney * 0.1;
      this.customToast.showSuccess('Áp dụng mã giảm giá thành công', 'Thông báo');
    } else if (couponCode === 'FREESHIP') {
      this.discountAmount = this.getShippingCost();
      this.customToast.showSuccess('Áp dụng mã miễn phí vận chuyển thành công', 'Thông báo');
    } else {
      this.discountAmount = 0;
      this.customToast.showError('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'Lỗi');
    }
    
    // Cập nhật lại tổng tiền
    this.updateOrderTotal();
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
  
  // Add currency formatting method
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Clear error message
  clearError(): void {
    this.errorMessage = '';
  }

  // Display error message
  showError(message: string): void {
    this.errorMessage = message;
    
    // Scroll to top to show the error message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-clear after 10 seconds
    setTimeout(() => {
      this.clearError();
    }, 10000);
  }
}
