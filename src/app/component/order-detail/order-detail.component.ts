import { Component, OnInit } from '@angular/core';
import {Product} from "../../model/product";
import {CartService} from "../../service/cart.service";
import {ProductService} from "../../service/product.service";
import {ApiResponse} from "../../dto/response/api.response";
import {environment} from "../../common/environment";

@Component({
  selector: 'app-order-confirm',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  cartItems: {product: Product, quantity: number}[] = [];
  totalPrice: number = 0;
  couponCode: string = '';
  constructor(
    private productService: ProductService,
    private cartService: CartService,
  ) { }

  ngOnInit(): void {
    debugger
    const cart = this.cartService.getCart();
    const productIds = Array.from(cart.keys());

    debugger
    this.productService.getProductsByIds(productIds).subscribe({
      next: (products: ApiResponse<Product[]>) => {
        debugger;
        this.cartItems = productIds.map((productId: number) => {
          debugger;
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
      },
      complete: () => {
        debugger;
        this.calculateTotalPrice();
      },
      error: (error: any) => {
        debugger;
        console.error('Error fetching product details:', error);
      }
    })
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }
}
