import { Component, OnInit } from '@angular/core';
import {Product} from "../../model/product";
import {ProductService} from "../../service/product.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../../common/environment";
import {ProductImage} from "../../model/product.image";
import {ApiResponse} from "../../dto/response/api.response";
import {CartService} from "../../service/cart.service";

@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.component.html',
  styleUrls: ['./detail-product.component.scss']
})
export class DetailProductComponent implements OnInit {
  product?: Product;
  productId: number = 0;
  currentImageIndex: number = 0;
  quantity: number = 1;
  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    debugger;
    // this.cartService.clearCart();
    const idParam = 2;
    if (idParam !== null) {
      this.productId += idParam;
    }
    if (!isNaN(this.productId)) {
      this.productService.getDetailProduct(this.productId).subscribe({
        next: (response: ApiResponse<Product>) => {
          debugger;
          console.log('Product response:', response);
          const product = response.result;
          if (product && product.productImages && product.productImages.length > 0) {
            product.productImages.forEach((productImage: ProductImage) => {
              productImage.imageUrl = `${environment.apiBaseUrl}/products/images/${productImage.imageUrl}`;
              console.log('Image URL:', productImage.imageUrl);
            });
          }
          this.product = product;
          this.showImage(0);
        },
        complete: () => {
          debugger;
        },
        error: (error: any) => {
          debugger;
          console.error('Error fetching product details:', error);
        }
      });
    } else {
      console.error('Invalid product ID:', idParam);
    }
  }

  showImage(index: number): void {
    debugger
    if(this.product && this.product.productImages && this.product.productImages.length > 0){
      if(index < 0){
        index = 0;
      } else if(index >= this.product.productImages.length){
        index = this.product.productImages.length - 1;
      }

      this.currentImageIndex = index;
    }
  }

  thumbnailClick(index: number): void {
    this.currentImageIndex = index;
  }
  nextImage(): void{
    this.showImage(this.currentImageIndex + 1);
  }

  previousImage(): void{
    this.showImage(this.currentImageIndex - 1);
  }

  addToCart(): void{
    debugger
    if(this.product){
      this.cartService.addToCart(this.product.id, this.quantity);
    } else{
      console.error('Product is not defined');
    }
  }

  increaseQuantity(): void{
    this.quantity++;
  }

  decreaseQuantity(): void{
    if(this.quantity > 0){
      this.quantity--;
    }
  }

  buyNow(): void{

  }
}
