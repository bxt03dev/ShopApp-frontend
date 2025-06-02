import { Component, OnInit, AfterViewInit } from '@angular/core';
import { UserService } from '../../../service/user.service';
import { ProductService } from '../../../service/product.service';
import { OrderService } from '../../../service/order.service';
import { TokenService } from '../../../service/token.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  totalUsers = 0;
  totalProducts = 0;
  totalOrders = 0;
  totalRevenue = 0;
  totalProductsSold = 0;
  soldProductLabels: string[] = [];
  soldProductData: number[] = [];
  chart: any;

  constructor(
    private userService: UserService,
    private productService: ProductService,
    private orderService: OrderService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadOrderStats();
    this.loadSoldProducts();
  }

  ngAfterViewInit(): void {
    this.renderChart();
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

  loadOrderStats(): void {
    this.orderService.getOrderStats().subscribe((res: any) => {
      this.totalRevenue = res.totalRevenue;
      this.totalProductsSold = res.totalProductsSold;
    });
  }

  loadSoldProducts(): void {
    this.orderService.getSoldProducts().subscribe((res: any) => {
      this.soldProductLabels = Object.keys(res);
      this.soldProductData = Object.values(res);
      this.renderChart();
    });
  }

  renderChart(): void {
    const canvas = document.getElementById('soldProductsChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.soldProductLabels,
        datasets: [{
          label: 'Số lượng đã bán',
          data: this.soldProductData,
          backgroundColor: 'rgba(52, 152, 219, 0.7)',
          borderColor: 'rgba(41, 128, 185, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: { title: { display: true, text: 'Sản phẩm' } },
          y: { title: { display: true, text: 'Số lượng đã bán' }, beginAtZero: true }
        }
      }
    });
  }
} 