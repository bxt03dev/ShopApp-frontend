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
        this.loading = false;
      },
      error: (error) => {
        this.error = 'An error occurred while searching. Please try again.';
        this.loading = false;
        console.error('Search error:', error);
      }
    });
  }
} 