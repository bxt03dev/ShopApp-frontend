import { Component, OnInit } from '@angular/core';
import {Product} from "../../model/product";
import {ProductService} from "../../service/product.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../../common/environment";
import {ProductImage} from "../../model/product.image";
import {ApiResponse} from "../../dto/response/api.response";
import {CartService} from "../../service/cart.service";
import { ToastrService } from 'ngx-toastr';

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
  loading: boolean = true;
  error: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam !== null) {
      this.productId = parseInt(idParam, 10);
    }

    if (!isNaN(this.productId)) {
      this.productService.getDetailProduct(this.productId).subscribe({
        next: (response: ApiResponse<Product>) => {
          console.log('Product response:', response);
          if (response.result) {
            const product = response.result;
            if (product.productImages && product.productImages.length > 0) {
              product.productImages.forEach((productImage: ProductImage) => {
                productImage.imageUrl = `${environment.apiBaseUrl}/products/images/${productImage.imageUrl}`;
              });
            }
            this.product = product;
            this.showImage(0);
          } else {
            this.error = 'Product not found';
          }
        },
        error: (error: any) => {
          console.error('Error fetching product details:', error);
          this.error = 'Failed to load product details. Please try again later.';
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid product ID';
      this.loading = false;
    }
  }

  showImage(index: number): void {
    if(this.product && this.product.productImages && this.product.productImages.length > 0) {
      if(index < 0) {
        index = 0;
      } else if(index >= this.product.productImages.length) {
        index = this.product.productImages.length - 1;
      }
      this.currentImageIndex = index;
    }
  }

  thumbnailClick(index: number): void {
    this.showImage(index);
  }

  nextImage(): void {
    this.showImage(this.currentImageIndex + 1);
  }

  previousImage(): void {
    this.showImage(this.currentImageIndex - 1);
  }

  addToCart(): void {
    if(this.product) {
      this.cartService.addToCart(this.product.id, this.quantity).then(success => {
        if (success) {
          this.toastr.success(`Đã thêm ${this.quantity} ${this.product!.name} vào giỏ hàng!`, 'Thông báo');
        } else {
          if (this.product!.quantity !== undefined && this.product!.quantity <= 0) {
            this.toastr.error('Sản phẩm đã hết hàng!', 'Lỗi');
          } else if (this.product!.quantity !== undefined && this.quantity > this.product!.quantity) {
            this.toastr.error(`Không đủ số lượng, chỉ còn ${this.product!.quantity} sản phẩm!`, 'Lỗi');
          } else if (!this.cartService.isLoggedIn()) {
            this.toastr.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'Thông báo');
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          } else {
            this.toastr.error('Không thể thêm sản phẩm vào giỏ hàng', 'Lỗi');
          }
        }
      });
    } else {
      this.toastr.error('Không thể thêm sản phẩm vào giỏ hàng', 'Lỗi');
    }
  }

  increaseQuantity(): void {
    if (this.product?.quantity !== undefined && this.quantity >= this.product.quantity) {
      this.toastr.warning(`Không thể thêm. Chỉ còn ${this.product.quantity} sản phẩm trong kho.`, 'Thông báo');
      return;
    }
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  buyNow(): void {
    if(this.product) {
      this.cartService.addToCart(this.product.id, this.quantity).then(success => {
        if (success) {
          this.router.navigate(['/orders']);
        } else {
          if (this.product!.quantity !== undefined && this.product!.quantity <= 0) {
            this.toastr.error('Sản phẩm đã hết hàng!', 'Lỗi');
          } else if (this.product!.quantity !== undefined && this.quantity > this.product!.quantity) {
            this.toastr.error(`Không đủ số lượng, chỉ còn ${this.product!.quantity} sản phẩm!`, 'Lỗi');
          } else {
            this.toastr.warning('Vui lòng đăng nhập để mua sản phẩm', 'Thông báo');
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          }
        }
      });
    }
  }
}
