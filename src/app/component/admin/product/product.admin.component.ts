import { Component, OnInit } from '@angular/core';
import { Product } from '../../../model/product';
import { ProductService } from '../../../service/product.service';
import { environment } from '../../../common/environment';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-product',
  templateUrl: './product.admin.component.html',
  styleUrls: ['./product.admin.component.scss']
})
export class ProductAdminComponent implements OnInit {
  products: Product[] = [];
  currentPage = 1;
  totalPages = 0;
  pageSize = 10;
  loading = false;
  visiblePages: number[] = [];
  
  constructor(
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.currentPage - 1, this.pageSize)
      .subscribe({
        next: (response) => {
          const productListResponse = response.result;
          productListResponse.products.forEach((product: Product) => {
            product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
          });
          this.products = productListResponse.products;
          this.totalPages = productListResponse.totalPages;
          this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading = false;
        }
      });
  }

  generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
    const maxVisiblePages = 5;
    const halfMaxVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(currentPage - halfMaxVisible, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }
    return new Array(endPage - startPage + 1).fill(0).map((_, index) => startPage + index);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  prevPage(): void {
    this.changePage(this.currentPage - 1);
  }

  nextPage(): void {
    this.changePage(this.currentPage + 1);
  }

  viewProductDetails(productId: number): void {
    this.router.navigate(['/admin/products', productId]);
  }

  deleteProduct(productId: number): void {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId).subscribe({
          next: (response) => {
            Swal.fire(
              'Đã xóa!',
              'Sản phẩm đã được xóa thành công.',
              'success'
            );
            this.loadProducts(); // Reload the products list
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            Swal.fire(
              'Lỗi!',
              'Không thể xóa sản phẩm. Vui lòng thử lại sau.',
              'error'
            );
          }
        });
      }
    });
  }

  getImageUrl(product: Product): string {
    return product.thumbnail;
  }
} 