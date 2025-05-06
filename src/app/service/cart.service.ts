import {ProductService} from "./product.service";
import {Injectable} from "@angular/core";
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class CartService{
  private cart: Map<number, number> = new Map();
  private cartItemCount = new BehaviorSubject<number>(0);

  constructor(private productService : ProductService) {
    const storeCart = localStorage.getItem('cart');
    if(storeCart){
      this.cart = new Map(JSON.parse(storeCart));
      this.updateCartItemCount();
    }
  }

  addToCart(productId: number, quantity: number = 1) {
    debugger
    if(this.cart.has(productId)){
      this.cart.set(productId, this.cart.get(productId)! + quantity);
    } else{
      this.cart.set(productId, quantity);
    }
    this.saveCartToLocalStorage();
    this.updateCartItemCount();
  }

  getCart(): Map<number, number> {
    debugger
    return this.cart;
  }

  getCartItemCount() {
    return this.cartItemCount.asObservable();
  }

  private updateCartItemCount() {
    const count = Array.from(this.cart.values()).reduce((sum, quantity) => sum + quantity, 0);
    this.cartItemCount.next(count);
  }

  private saveCartToLocalStorage(): void{
    localStorage.setItem('cart', JSON.stringify(Array.from(this.cart.entries())));
  }

  clearCart(): void{
    this.cart.clear();
    this.saveCartToLocalStorage();
    this.updateCartItemCount();
  }

  loadCart(): void {
    const storeCart = localStorage.getItem('cart');
    if (storeCart) {
      this.cart = new Map(JSON.parse(storeCart));
      this.updateCartItemCount();
    }
  }

  setCart(cart: Map<number, number>) {
    this.cart = cart ?? new Map<number, number>()
    this.saveCartToLocalStorage()
    this.updateCartItemCount();
  }
}
