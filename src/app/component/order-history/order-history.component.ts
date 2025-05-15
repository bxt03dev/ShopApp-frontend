import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../service/order.service';
import { TokenService } from '../../service/token.service';
import { Router } from '@angular/router';
import { environment } from '../../common/environment';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
  orders: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  page: number = 0;
  limit: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  statusColors: {[key: string]: string} = {
    'PENDING': 'status-pending',
    'PROCESSING': 'status-processing',
    'SHIPPED': 'status-shipped',
    'DELIVERED': 'status-delivered',
    'CANCELLED': 'status-cancelled'
  };

  constructor(
    private orderService: OrderService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.tokenService.getToken() || this.tokenService.isTokenExpired()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/order-history' } });
      return;
    }
    
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = ''; // Reset error message
    const userId = this.tokenService.getUserId();
    
    console.log('Attempting to load orders for user ID:', userId);
    
    if (!userId) {
      this.errorMessage = 'Không thể xác định người dùng. Vui lòng đăng nhập lại.';
      this.loading = false;
      return;
    }

    this.orderService.getOrdersByUserId(userId, this.page, this.limit).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Order response raw:', response); // Debugging
        
        try {
          // Xử lý theo định dạng ApiResponse từ backend
          if (response && response.result) {
            console.log('Response contains result property', response.result);
            
            // Backend OrderController.getOrdersByUserId trả về ApiResponse<Object>
            if (Array.isArray(response.result)) {
              // Nếu result là mảng các đơn hàng
              this.orders = response.result;
            } else {
              // Nếu result không phải mảng, có thể là đối tượng chứa danh sách đơn hàng
              console.log('Result is not an array, checking properties');
              this.orders = [];
            }
            
            this.totalPages = 1; // Không có phân trang từ API
            this.totalElements = this.orders.length;
          } else if (response && response.code === 200 && response.result) {
            // Định dạng API khác với code
            this.orders = Array.isArray(response.result) ? response.result : [];
            this.totalPages = 1;
            this.totalElements = this.orders.length;
          } else {
            // Định dạng khác hoàn toàn
            console.log('Response does not contain expected structure');
            this.orders = [];
            this.errorMessage = 'Không tìm thấy dữ liệu đơn hàng';
          }
          
          if (this.orders.length > 0) {
            console.log('Found orders:', this.orders);
            this.processOrderImages();
          } else {
            console.log('No orders found for user');
          }
        } catch (err) {
          console.error('Error parsing order data:', err);
          this.errorMessage = 'Lỗi khi xử lý dữ liệu đơn hàng.';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading orders:', error);
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          // Redirect to login after a delay
          setTimeout(() => {
            this.router.navigate(['/login'], { queryParams: { returnUrl: '/order-history' } });
          }, 2000);
        } else if (error.status === 404) {
          this.errorMessage = 'Không tìm thấy API endpoint. Vui lòng liên hệ quản trị viên.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Đã xảy ra lỗi khi tải lịch sử đơn hàng. Vui lòng thử lại sau.';
        }
      }
    });
  }

  processOrderImages(): void {
    // Xử lý hình ảnh sản phẩm trong các mục đơn hàng
    this.orders.forEach(order => {
      // Xử lý orderItems hoặc orderDetails tùy theo cấu trúc dữ liệu
      const items = order.orderItems || order.orderDetails;
      
      if (items && Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item.product && item.product.thumbnail) {
            // Đường dẫn hình ảnh có thể đã đầy đủ hoặc cần thêm baseUrl
            if (!item.product.thumbnail.startsWith('http')) {
              item.product.thumbnail = `${environment.apiBaseUrl}/products/images/${item.product.thumbnail}`;
            }
          } else if (item.productImage) {
            // Trường hợp API trả về productImage thay vì product.thumbnail
            if (!item.productImage.startsWith('http')) {
              item.productImage = `${environment.apiBaseUrl}/products/images/${item.productImage}`;
            }
            // Tạo đối tượng product nếu không tồn tại
            if (!item.product) {
              item.product = {
                name: item.productName,
                thumbnail: item.productImage
              };
            }
          }
        });
      }
    });
    
    console.log('Processed orders:', this.orders);
  }

  viewOrderDetail(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadOrders();
    }
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-default';
    
    // Chuyển đổi thành chữ in hoa để so sánh không phân biệt hoa thường
    const upperStatus = status.toUpperCase();
    
    // Map các giá trị trạng thái có thể có
    if (upperStatus.includes('PENDING') || upperStatus.includes('CHỜ')) {
      return 'status-pending';
    } else if (upperStatus.includes('PROCESSING') || upperStatus.includes('XỬ LÝ')) {
      return 'status-processing';
    } else if (upperStatus.includes('SHIPPED') || upperStatus.includes('SHIPPING') || upperStatus.includes('GIAO')) {
      return 'status-shipped';
    } else if (upperStatus.includes('DELIVERED') || upperStatus.includes('COMPLETED') || upperStatus.includes('HOÀN THÀNH')) {
      return 'status-delivered';
    } else if (upperStatus.includes('CANCELLED') || upperStatus.includes('HỦY')) {
      return 'status-cancelled';
    }
    
    return 'status-default';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
