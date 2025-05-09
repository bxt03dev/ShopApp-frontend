import {ProductService} from "./product.service";
import {Injectable} from "@angular/core";
import { BehaviorSubject } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class CartService{
  private cart: Map<number, number> = new Map();
  private cartItemCount = new BehaviorSubject<number>(0);

  constructor(
    private productService: ProductService,
    private tokenService: TokenService
  ) {
    this.loadCart();
  }

  private getCartKey(): string {
    const userId = this.tokenService.getUserId();
    return userId ? `cart_${userId}` : 'cart_guest';
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.getToken() && !this.tokenService.isTokenExpired() && this.tokenService.getUserId() > 0;
  }

  addToCart(productId: number, quantity: number = 1): Promise<boolean> {
    if (!this.isLoggedIn()) {
      return Promise.resolve(false);
    }

    // Fetch product details to check quantity
    return new Promise<boolean>((resolve) => {
      this.productService.getDetailProduct(productId).subscribe({
        next: (response) => {
          const product = response.result;
          
          // Check if the product has quantity defined and if it's sufficient
          if (product.quantity === undefined || product.quantity === null || product.quantity <= 0) {
            resolve(false);
            return;
          }
          
          // Calculate the new quantity (existing + added)
          const existingQuantity = this.cart.has(productId) ? this.cart.get(productId)! : 0;
          const newQuantity = existingQuantity + quantity;
          
          // Check if the new quantity exceeds available stock
          if (newQuantity > product.quantity) {
            resolve(false);
            return;
          }
          
          // Update cart if quantity is sufficient
          this.cart.set(productId, newQuantity);
          this.saveCartToLocalStorage();
          this.updateCartItemCount();
          resolve(true);
        },
        error: (error) => {
          console.error('Error checking product quantity:', error);
          resolve(false);
        }
      });
    });
  }

  getCart(): Map<number, number> {
    return this.cart;
  }

  getCartItemCount() {
    return this.cartItemCount.asObservable();
  }

  private updateCartItemCount() {
    const count = Array.from(this.cart.values()).reduce((sum, quantity) => sum + quantity, 0);
    this.cartItemCount.next(count);
  }

  private saveCartToLocalStorage(): void {
    localStorage.setItem(this.getCartKey(), JSON.stringify(Array.from(this.cart.entries())));
  }

  clearCart(): void {
    this.cart.clear();
    this.saveCartToLocalStorage();
    this.updateCartItemCount();
  }

  loadCart(): void {
    const storeCart = localStorage.getItem(this.getCartKey());
    if (storeCart) {
      this.cart = new Map(JSON.parse(storeCart));
      this.updateCartItemCount();
    }
  }

  setCart(cart: Map<number, number>) {
    this.cart = cart ?? new Map<number, number>();
    this.saveCartToLocalStorage();
    this.updateCartItemCount();
  }

  removeFromCart(productId: number): boolean {
    if (this.cart.has(productId)) {
      this.cart.delete(productId);
      this.saveCartToLocalStorage();
      this.updateCartItemCount();
      return true;
    }
    return false;
  }
}
