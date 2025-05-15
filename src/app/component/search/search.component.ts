import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../model/product';
import { ProductService } from '../../service/product.service';
import { environment } from '../../common/environment';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  searchResults: Product[] = [];
  searchQuery: string = '';
  loading: boolean = false;
  error: string = '';
  currentPage = 1;
  totalPages = 0;
  pageSize = 12;
  visiblePages: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      if (this.searchQuery) {
        this.searchProducts();
      }
    });
  }

  searchProducts(): void {
    this.loading = true;
    this.error = '';
    
    // TODO: Implement actual search API call
    // For now, we'll just get all products and filter them
    this.productService.getProducts(0, 100).subscribe({
      next: (response: any) => {
        const products = response.result.products;
        this.searchResults = products.filter((product: Product) => 
          product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        // Set product.url for image
        this.searchResults.forEach((product: Product) => {
          product.url = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
        });
        
        // Calculate total pages based on search results
        this.totalPages = Math.ceil(this.searchResults.length / this.pageSize);
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'An error occurred while searching. Please try again.';
        this.loading = false;
        console.error('Search error:', error);
      }
    });
  }
  
  generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  onPageChange(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }
} 