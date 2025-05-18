import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../model/product';
import { ProductService } from '../../service/product.service';
import { environment } from '../../common/environment';
import { interval, Subscription } from 'rxjs';

interface SliderImage {
  url: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('slides') slidesElement: ElementRef | undefined;

  products: Product[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 0;
  visiblePages: number[] = [];
  currentCategoryId: number | null = null;
  categoryNames: { [key: number]: string } = {
    1: 'Mac',
    2: 'iPad',
    3: 'iPhone',
    4: 'Watch',
    5: 'AirPods',
    6: 'Phụ kiện'
  };

  // Slider properties
  sliderImages: SliderImage[] = [
    {
      url: 'https://www.apple.com/v/mac/home/cg/images/overview/consider/boc_performance_01__slniatu7x8yi_large_2x.jpg',
      alt: 'Mac'
    },
    {
      url: 'https://www.apple.com/assets-www/vi_VN/ipad/feature_card_boc/large/ipados_apps_55ef25520_2x.jpg',
      alt: 'iPad'
    },
    {
      url: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=aWs5czA5aDFXU0FlMGFGRlpYRXk2UWFRQXQ2R0JQTk5udUZxTkR3ZVlpTEJnOG9obkp6NERCS3lnVm1tcnlVUjBoUVhuTWlrY2hIK090ZGZZbk9HeEd5aFM4QSthSG1nSUl6WXJQME1SZ2xuaExFM0dqUXdPMnVsQThrb3JxakRGblJodVFEaGgxMERMNjl1RlVMTnp3&traceId=1',
      alt: 'iPhone'
    },
    {
      url: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/s10-case-unselect-gallery-1-202503?wid=5120&hei=3280&fmt=p-jpg&qlt=80&.v=T1poMzZuRzBxQ1RzQmhMUHprUE5LZHlVRllKam5abHNZRGludXlMbytKNjZqY1lkK0tzZFpEVlpBSXpHb1VXNVBPMVJocHRGWWdEaGFBbE5iRklMb1hPYW04cW1YR2l1R0RzLzYxenhFZTlwZDRjSG44dlRjQnB4RFJ4d3IvN0o',
      alt: 'Watch'
    }
  ];
  currentSlideIndex: number = 0;
  sliderInterval: Subscription | undefined;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);
      if (params['category_id']) {
        this.currentCategoryId = +params['category_id'];
        console.log('Set currentCategoryId to:', this.currentCategoryId);
      } else {
        this.currentCategoryId = null;
        console.log('No category_id parameter, showing all products');
      }
      this.currentPage = 1;
      this.loadProducts();
    });
    this.startSliderAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopSliderAutoPlay();
  }

  loadProducts(): void {
    console.log('Loading products with categoryId:', this.currentCategoryId);
    if (this.currentCategoryId) {
      this.getProductsByCategory(this.currentPage, this.itemsPerPage, this.currentCategoryId);
    } else {
      this.getProducts(this.currentPage, this.itemsPerPage);
    }
  }

  getProducts(page: number, size: number): void {
    console.log('Fetching all products (no category filter)');
    this.productService.getProducts(page - 1, size).subscribe({
      next: (response: any) => {
        console.log('All products response:', response);
        const productListResponse = response.result;
        productListResponse.products.forEach((product: Product) => {
          product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
        });
        this.products = productListResponse.products;
        this.totalPages = productListResponse.totalPages;
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
      },
      complete: () => {
        console.log('Fetched products successfully');
      },
      error: (error: any) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  getProductsByCategory(page: number, size: number, categoryId: number): void {
    console.log(`Fetching products for category ID: ${categoryId}`);
    this.productService.getProductsByCategory(categoryId, page - 1, size).subscribe({
      next: (response: any) => {
        console.log(`Products by category ${categoryId} response:`, response);
        const productListResponse = response.result;
        productListResponse.products.forEach((product: Product) => {
          product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
        });
        this.products = productListResponse.products;
        this.totalPages = productListResponse.totalPages;
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
      },
      complete: () => {
        console.log(`Fetched products for category ${categoryId} successfully`);
      },
      error: (error: any) => {
        console.error(`Error fetching products for category ${categoryId}:`, error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
    this.scrollToTop();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
    const maxVisiblePages = 5;
    const halfMaxVisible = Math.floor(maxVisiblePages / 2);
    
    // Không đủ trang để hiển thị đầy đủ
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Đang ở gần trang đầu
    if (currentPage <= halfMaxVisible + 1) {
      return Array.from({ length: maxVisiblePages }, (_, i) => i + 1);
    }
    
    // Đang ở gần trang cuối
    if (currentPage >= totalPages - halfMaxVisible) {
      return Array.from({ length: maxVisiblePages }, (_, i) => totalPages - maxVisiblePages + i + 1);
    }
    
    // Đang ở giữa
    return Array.from({ length: maxVisiblePages }, (_, i) => currentPage - halfMaxVisible + i);
  }

  prevPage(): void {
    this.onPageChange(this.currentPage - 1);
  }

  nextPage(): void {
    this.onPageChange(this.currentPage + 1);
  }

  // Slider methods
  startSliderAutoPlay(): void {
    this.sliderInterval = interval(2000).subscribe(() => {
      this.nextSlide();
    });
  }

  stopSliderAutoPlay(): void {
    if (this.sliderInterval) {
      this.sliderInterval.unsubscribe();
    }
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.sliderImages.length;
  }

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.sliderImages.length) % this.sliderImages.length;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }
}
