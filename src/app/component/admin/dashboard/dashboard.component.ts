import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../service/user.service';
import { ProductService } from '../../../service/product.service';
import { OrderService } from '../../../service/order.service';
import { TokenService } from '../../../service/token.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  totalUsers = 0;
  totalProducts = 0;
  totalOrders = 0;

  constructor(
    private userService: UserService,
    private productService: ProductService,
    private orderService: OrderService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    const token = this.tokenService.getToken();
    if (token) {
      this.userService.getAllUsers(token).subscribe((res: any) => {
        this.totalUsers = res.result ? res.result.length : 0;
      });
    }
    this.productService.getProducts(0, 1_000_000).subscribe((res: any) => {
      this.totalProducts = res.result ? res.result.products.length : 0;
    });
    this.orderService.getAllOrders('', 0, 1_000_000).subscribe((res: any) => {
      this.totalOrders = res.result ? res.result.orders.length : 0;
    });
  }
} 