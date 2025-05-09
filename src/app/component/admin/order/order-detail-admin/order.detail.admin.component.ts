import { Component, OnInit } from "@angular/core";
import { OrderResponse } from "../../../../response/order/order.response";
import { OrderService } from "../../../../service/order.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { OrderDTO } from "../../../../dto/user/order.dto";
import { environment } from "../../../../common/environment";

@Component({
  selector: 'app-order-detail-admin',
  templateUrl: './order.detail.admin.component.html',
  styleUrls: ['./order.detail.admin.component.scss']
})

export class OrderDetailAdminComponent implements OnInit {
  order: OrderResponse | null = null;
  orderId: number = 0;
  isEditing: boolean = false;
  
  // Form model cho việc update
  orderUpdate: any = {
    userId: 0,
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    note: '',
    status: '',
    totalMoney: 0,
    shippingMethod: '',
    paymentMethod: '',
    couponCode: '',
    cartItems: []
  };

  constructor(
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orderId = +params['id']; // Chuyển đổi id từ string sang number
      this.getOrderDetails(this.orderId);
    });
  }

  getOrderDetails(orderId: number): void {
    console.log('Getting order details for ID:', orderId);
    this.orderService.getOrderById(orderId).subscribe({
      next: (response: any) => {
        console.log('API Response:', response); // Log để debug
        if (response && response.result) {
          // Lưu trữ order cũ để so sánh
          const oldOrder = this.order ? JSON.stringify(this.order) : null;
          
          // Cập nhật order mới
          this.order = response.result;
          
          // Format thumbnail URLs for products in order details
          if (this.order && this.order.orderDetails && this.order.orderDetails.length > 0) {
            this.order.orderDetails.forEach(detail => {
              if (detail.product && detail.product.thumbnail) {
                // Check if thumbnail already has the full URL
                if (!detail.product.thumbnail.startsWith('http') && 
                    !detail.product.thumbnail.startsWith(environment.apiBaseUrl)) {
                  detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.product.thumbnail}`;
                }
              }
            });
          }
          
          console.log('Order data after update:', this.order); // Log để debug
          
          // So sánh xem có thay đổi thực sự không
          const newOrder = JSON.stringify(this.order);
          if (oldOrder !== newOrder) {
            console.log('Order data changed!');
          } else {
            console.log('No change in order data');
          }
          
          // Khởi tạo dữ liệu form update từ order
          this.initUpdateForm();
        } else {
          console.warn('No result data in response');
          // Nếu không có kết quả, thử lại sau 1 giây
          // (có thể server chưa cập nhật xong dữ liệu)
          setTimeout(() => {
            console.log('Retrying to fetch order data...');
            this.refreshOrderData();
          }, 1000);
        }
      },
      error: (error: any) => {
        console.error('Error fetching order details:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
      }
    });
  }

  initUpdateForm(): void {
    if (this.order) {
      this.orderUpdate = {
        userId: this.order.userId,
        fullName: this.order.fullName || '',
        email: this.order.email || '',
        phoneNumber: this.order.phoneNumber || '',
        address: this.order.address || '',
        note: this.order.note || '',
        status: this.order.status || 'pending',
        totalMoney: this.order.totalMoney || 0,
        shippingMethod: this.order.shippingMethod || '',
        paymentMethod: this.order.paymentMethod || '',
        couponCode: '',
        cartItems: []
      };
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form khi hủy
      this.initUpdateForm();
    }
  }

  updateOrder(): void {
    // Tạo một bản sao hợp lệ của OrderDTO
    const orderUpdatePayload = new OrderDTO({
      userId: this.orderUpdate.userId,
      fullName: this.orderUpdate.fullName,
      email: this.orderUpdate.email,
      phoneNumber: this.orderUpdate.phoneNumber,
      address: this.orderUpdate.address,
      note: this.orderUpdate.note,
      status: this.orderUpdate.status,        // Thêm trường status vào dữ liệu gửi đi
      totalMoney: this.orderUpdate.totalMoney,
      shippingMethod: this.orderUpdate.shippingMethod,
      paymentMethod: this.orderUpdate.paymentMethod,
      couponCode: '',
      cartItems: []
    });

    console.log('Sending update data:', orderUpdatePayload); // Log dữ liệu gửi đi

    // Lưu trữ giá trị hiện tại để so sánh sau khi cập nhật
    const currentStatus = this.orderUpdate.status;
    // Lưu trữ chi tiết đơn hàng để giữ lại dữ liệu sản phẩm
    const currentOrderDetails = this.order?.orderDetails || [];
    
    this.orderService.updateOrder(this.orderId, orderUpdatePayload).subscribe({
      next: (response: any) => {
        console.log('Update response:', response); // Log phản hồi từ server
        
        // Hiển thị chi tiết response để debug
        if (response) {
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response));
          
          // Nếu response có dữ liệu result, sử dụng dữ liệu từ response để cập nhật
          if (response.result) {
            console.log('Response result:', response.result);
            // Cập nhật order từ dữ liệu trả về từ server để đảm bảo có dữ liệu mới nhất
            this.order = response.result;
            
            // Giữ lại dữ liệu sản phẩm từ orderDetails trước đó nếu server không trả về
            if (this.order && (!this.order.orderDetails || this.order.orderDetails.length === 0)) {
              this.order.orderDetails = currentOrderDetails;
            }
            
            // Format thumbnail URLs for products in order details
            if (this.order && this.order.orderDetails && this.order.orderDetails.length > 0) {
              this.order.orderDetails.forEach(detail => {
                if (detail.product && detail.product.thumbnail) {
                  // Check if thumbnail already has the full URL
                  if (!detail.product.thumbnail.startsWith('http') && 
                      !detail.product.thumbnail.startsWith(environment.apiBaseUrl)) {
                    detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.product.thumbnail}`;
                  }
                }
              });
            }
            
            console.log('Order updated from server response:', this.order);
          } else {
            // Nếu không có dữ liệu từ server, cập nhật từ form
            if (this.order) {
              this.order.fullName = this.orderUpdate.fullName;
              this.order.email = this.orderUpdate.email;
              this.order.phoneNumber = this.orderUpdate.phoneNumber;
              this.order.address = this.orderUpdate.address;
              this.order.note = this.orderUpdate.note;
              this.order.status = this.orderUpdate.status;
              this.order.totalMoney = this.orderUpdate.totalMoney;
              this.order.shippingMethod = this.orderUpdate.shippingMethod;
              this.order.paymentMethod = this.orderUpdate.paymentMethod;
              
              console.log('Order updated from form data:', this.order);
            }
          }
        }
        
        alert('Order updated successfully!');
        this.isEditing = false;
        
        // Kiểm tra xem order.status đã được cập nhật chưa
        if (this.order && this.order.status !== currentStatus) {
          console.log(`Status updated successfully: ${currentStatus} -> ${this.order.status}`);
        } else if (this.order) {
          console.warn('Status may not have been updated correctly:', this.order.status);
          // Force cập nhật status
          this.order.status = currentStatus;
        }
      },
      error: (error: any) => {
        console.error('Error updating order:', error);
        alert('Failed to update order. Please try again.');
        
        // Log chi tiết lỗi
        if (error.error) {
          console.error('Error details:', error.error);
        }
        if (error.message) {
          console.error('Error message:', error.message);
        }
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  // Hàm helper để format ngày
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
    
    // Nếu date là mảng [năm, tháng, ngày]
    if (Array.isArray(date) && date.length >= 3) {
      return new Date(date[0], date[1] - 1, date[2]).toLocaleDateString();
    }
    
    return 'N/A';
  }

  // Thêm hàm mới để làm mới dữ liệu đơn hàng khi cần
  refreshOrderData(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (response: any) => {
        if (response && response.result) {
          console.log('Refreshed order data:', response.result);
          this.order = response.result;
          
          // Format thumbnail URLs for products in order details
          if (this.order && this.order.orderDetails && this.order.orderDetails.length > 0) {
            this.order.orderDetails.forEach(detail => {
              if (detail.product && detail.product.thumbnail) {
                // Check if thumbnail already has the full URL
                if (!detail.product.thumbnail.startsWith('http') && 
                    !detail.product.thumbnail.startsWith(environment.apiBaseUrl)) {
                  detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.product.thumbnail}`;
                }
              }
            });
          }
          
          this.initUpdateForm();
        } else {
          console.warn('Failed to refresh order data');
        }
      },
      error: (error: any) => {
        console.error('Error refreshing order data:', error);
      }
    });
  }
} 