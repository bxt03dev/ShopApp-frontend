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

      this.orderService.placeOrder(this.orderData).subscribe({
        next: (response) => {
          this.customToast.showSuccess('Đặt hàng thành công!', 'Thông báo');
          this.cartService.clearCart();
          this.loadCartItems();
          this.router.navigate(['/']);
        },
        error: (error: any) => {
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
