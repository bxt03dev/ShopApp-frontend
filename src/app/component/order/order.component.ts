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
                return {
                  product: product,
                  quantity: this.cart.get(productId) || 0
                };
              }
              return null;
            })
            .filter((item): item is { product: Product; quantity: number } => item !== null);

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
        next: () => {
          alert('Order placed successfully');
          this.cartService.clearCart();
          this.loadCartItems();
          this.router.navigate(['/']);
        },
        error: (error: any) => {
          alert(`Error placing order: ${error.message || 'Unknown error'}`);
        }
      });
    } else {
      alert('Please fill in all required fields correctly.');
    }
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateCartFromCartItems();
    }
  }

  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
    this.updateCartFromCartItems();
  }

  calculateTotal(): void {
    this.totalMoney = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  confirmDelete(index: number): void {
    if (confirm('Are you sure you want to remove this item?')) {
      this.cartItems.splice(index, 1);
      this.updateCartFromCartItems();
    }
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
