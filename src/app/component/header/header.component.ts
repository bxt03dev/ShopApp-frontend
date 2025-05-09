import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CartService } from '../../service/cart.service';
import { Subscription, interval } from 'rxjs';
import { UserService } from '../../service/user.service';
import { UserResponse } from '../../response/user/user.response';
import { TokenService } from '../../service/token.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  cartItemCount: number = 0;
  private cartSubscription: Subscription;
  private routerSubscription: Subscription;
  private tokenCheckSubscription: Subscription | undefined;
  userResponse: UserResponse | null = null;
  dropdownOpen: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private userService: UserService,
    private tokenService: TokenService,
    private toastr: ToastrService
  ) {
    this.cartSubscription = this.cartService.getCartItemCount().subscribe(
      count => this.cartItemCount = count
    );
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadUserInfo();
        this.dropdownOpen = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
    // Kiểm tra token hết hạn mỗi phút
    this.tokenCheckSubscription = interval(60000).subscribe(() => {
      this.loadUserInfo();
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
    }
  }

  loadUserInfo(): void {
    if (this.tokenService.isTokenExpired()) {
      this.tokenService.removeToken();
      this.userService.removeUserFromLocalStorage();
      this.userResponse = null;
      return;
    }
    this.userResponse = this.userService.getUserResponseFromLocalStorage();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.dropdownOpen = false;
    }
  }

  logout(): void {
    this.tokenService.removeToken();
    this.userService.removeUserFromLocalStorage();
    this.cartService.clearCart();
    this.userResponse = null;
    this.dropdownOpen = false;
    this.toastr.success('Đăng xuất thành công!', 'Thông báo');
    this.router.navigate(['/']);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }

  navigateByCategory(categoryId: number): void {
    console.log(`Navigating to category ID: ${categoryId}`);
    this.router.navigate(['/home'], {
      queryParams: { category_id: categoryId },
      queryParamsHandling: 'merge'
    });
  }
}
