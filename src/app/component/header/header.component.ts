import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CartService } from '../../service/cart.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserService } from '../../service/user.service';
import { UserResponse } from '../../response/user/user.response';

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
  userResponse: UserResponse | null = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private userService: UserService
  ) {
    this.cartSubscription = this.cartService.getCartItemCount().subscribe(
      count => this.cartItemCount = count
    );

    // Subscribe to router events to update user info when navigation occurs
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadUserInfo();
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadUserInfo(): void {
    this.userResponse = this.userService.getUserResponseFromLocalStorage();
    console.log('User info loaded:', this.userResponse); // Debug log
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }
}
