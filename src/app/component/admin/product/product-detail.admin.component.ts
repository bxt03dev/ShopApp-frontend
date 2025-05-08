import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../model/product';
import { ProductService } from '../../../service/product.service';
import { environment } from '../../../common/environment';

@Component({
  selector: 'app-admin-product-detail',
  templateUrl: './product-detail.admin.component.html',
  styleUrls: ['./product-detail.admin.component.scss']
})
export class ProductDetailAdminComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  productId: number = 0;
  imageUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = +id;
        this.loadProductDetails(this.productId);
      } else {
        this.router.navigate(['/admin/products']);
      }
    });
  }

  loadProductDetails(id: number): void {
    this.loading = true;
    this.productService.getDetailProduct(id).subscribe({
      next: (response) => {
        this.product = response.result;
        if (this.product && this.product.thumbnail) {
          this.imageUrl = `${environment.apiBaseUrl}/products/images/${this.product.thumbnail}`;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        this.loading = false;
        this.router.navigate(['/admin/products']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/products']);
  }
}
