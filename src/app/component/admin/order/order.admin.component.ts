import {Component, Inject, OnInit} from "@angular/core";
import {OrderResponse} from "../../../response/order/order.response";
import {DOCUMENT} from "@angular/common";
import {OrderService} from "../../../service/order.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Location} from "@angular/common";

@Component({
  selector: 'app-order-admin',
  templateUrl: './order.admin.component.html',
  styleUrls: ['./order.admin.component.scss']
})

export class OrderAdminComponent implements OnInit{
  orders: OrderResponse[] = []
  currentPage: number = 0
  itemsPerPage: number = 12
  pages: number[] = []
  totalPages: number = 0
  keyword: string = ''
  visiblePages: number[] = []
  localStorage?: Storage
  constructor(
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.localStorage = document.defaultView?.localStorage
  }
  ngOnInit(): void {
    this.currentPage = Number(this.localStorage?.getItem('currentOrderAdminPage')) || 0
    this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage)
  }

  searchOrders() {
    this.currentPage = 0
    this.itemsPerPage = 12
    this.getAllOrders(this.keyword.trim(), this.currentPage, this.itemsPerPage)
  }

  getAllOrders(keyword: string, page: number, limit: number) {
    this.orderService.getAllOrders(keyword, page, limit).subscribe({
      next: (response: any) => {
        if (response && response.result) {
          this.orders = response.result.orders
          this.totalPages = response.result.totalPages
          this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages)
        }
      },
      error: (error: any) => {
        console.error('Error fetching orders:', error)
      }
    })
  }

  onPageChange(page: number) {
    this.currentPage = page < 0 ? 0 : page
    this.localStorage?.setItem('currentOrderAdminPage', String(this.currentPage))
    this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage)
  }

  generateVisiblePageArray(currentPage: number, totalPages: number): number[] {
    const maxVisiblePages = 5
    const halfVisiblePages = Math.floor(maxVisiblePages / 2)

    let startPage = Math.max(currentPage - halfVisiblePages, 0)
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 0)
    }

    return new Array(endPage - startPage + 1).fill(0)
      .map((_, index) => startPage + index)
  }

  // Helper để hiển thị số trang người dùng thấy (bắt đầu từ 1)
  getDisplayPageNumber(index: number): number {
    return index + 1;
  }



  viewDetails(order: OrderResponse) {
    this.router.navigate(['/admin/orders', order.id])
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';

    // Nếu date là timestamp (number)
    if (typeof date === 'number') {
      return new Date(date).toLocaleString();
    }

    // Nếu date là Date object
    if (date instanceof Date) {
      return date.toLocaleString();
    }

    // Nếu date là string ISO format
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }

    return 'N/A';
  }

  formatArrayDate(dateArray: any): string {
    if (!dateArray) return 'N/A';

    // Nếu là mảng [năm, tháng, ngày]
    if (Array.isArray(dateArray) && dateArray.length >= 3) {
      // JavaScript months are 0-based, so we subtract 1 from the month
      return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]).toLocaleDateString();
    }

    return 'N/A';
  }

  isArray(obj: any): boolean {
    return Array.isArray(obj);
  }
}
