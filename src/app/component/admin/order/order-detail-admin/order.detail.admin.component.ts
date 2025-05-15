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
        
        // Xác định dữ liệu đơn hàng từ response
        let orderData = response;
        
        // Kiểm tra các định dạng response có thể có
        if (response && response.result) {
          console.log('Response contains result property, extracting data');
          orderData = response.result;
        }
        
        // Lưu trữ order cũ để so sánh
        const oldOrder = this.order ? JSON.stringify(this.order) : null;
        
        // Cập nhật order mới
        this.order = orderData;
        
        if (this.order) {
          console.log('Order status:', this.order.status);
          console.log('Order totalMoney:', this.order.totalMoney);
          
          // Format thumbnail URLs for products in order details
          if (this.order.orderDetails && this.order.orderDetails.length > 0) {
            console.log('Order details count:', this.order.orderDetails.length);
            this.order.orderDetails.forEach(detail => {
              if (detail.product && detail.product.thumbnail) {
                // Check if thumbnail already has the full URL
                if (!detail.product.thumbnail.startsWith('http') && 
                    !detail.product.thumbnail.startsWith(environment.apiBaseUrl)) {
                  detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.product.thumbnail}`;
                }
              } else {
                console.warn('Product or thumbnail missing in order detail:', detail);
              }
            });
          } else {
            console.warn('No order details found in order');
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
          console.error('Order data is null or undefined after processing');
          alert('Failed to load order data. Please try again.');
        }
      },
      error: (error: any) => {
        console.error('Error fetching order details:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        alert('Error loading order details. Please try again.');
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
        
        // Xác định dữ liệu đơn hàng từ response
        let updatedOrderData = response;
        
        // Kiểm tra các định dạng response có thể có
        if (response && response.result) {
          console.log('Response contains result property, extracting data');
          updatedOrderData = response.result;
        }
        
        // Cập nhật dữ liệu đơn hàng
        if (updatedOrderData && typeof updatedOrderData === 'object') {
          // Cập nhật order từ dữ liệu trả về từ server
          this.order = updatedOrderData;
          
          // Nếu không có orderDetails, sử dụng dữ liệu cũ
          if (this.order && (!this.order.orderDetails || this.order.orderDetails.length === 0)) {
            this.order.orderDetails = currentOrderDetails;
            console.log('Restored order details from previous data');
          }
          
          // Format thumbnail URLs for products
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
          
          console.log('Order updated successfully:', this.order);
          alert('Order updated successfully!');
        } else {
          console.warn('No valid data in response, updating from form data');
          
          // Nếu không có dữ liệu từ server, cập nhật từ form
          if (this.order) {
            this.order.fullName = this.orderUpdate.fullName;
            this.order.email = this.orderUpdate.email;
            this.order.phoneNumber = this.orderUpdate.phoneNumber;
            this.order.address = this.orderUpdate.address;
            this.order.note = this.orderUpdate.note;
            this.order.status = currentStatus;
            this.order.totalMoney = this.orderUpdate.totalMoney;
            this.order.shippingMethod = this.orderUpdate.shippingMethod;
            this.order.paymentMethod = this.orderUpdate.paymentMethod;
            
            console.log('Order updated from form data:', this.order);
            alert('Order updated with form data!');
          } else {
            console.error('Cannot update order: order object is null');
            alert('Update failed: Could not update order data');
          }
        }
        
        this.isEditing = false;
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
    console.log('Refreshing order data for ID:', this.orderId);
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (response: any) => {
        console.log('Refresh API Response:', response);
        
        // Xác định dữ liệu đơn hàng từ response
        let orderData = response;
        
        // Kiểm tra các định dạng response có thể có
        if (response && response.result) {
          console.log('Response contains result property, extracting data');
          orderData = response.result;
        }
        
        // Cập nhật order mới
        this.order = orderData;
        
        if (this.order) {
          console.log('Refreshed order status:', this.order.status);
          console.log('Refreshed order totalMoney:', this.order.totalMoney);
          
          // Format thumbnail URLs for products in order details
          if (this.order.orderDetails && this.order.orderDetails.length > 0) {
            console.log('Refreshed order details count:', this.order.orderDetails.length);
            this.order.orderDetails.forEach(detail => {
              if (detail.product && detail.product.thumbnail) {
                // Check if thumbnail already has the full URL
                if (!detail.product.thumbnail.startsWith('http') && 
                    !detail.product.thumbnail.startsWith(environment.apiBaseUrl)) {
                  detail.product.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.product.thumbnail}`;
                }
              } else {
                console.warn('Product or thumbnail missing in order detail:', detail);
              }
            });
          } else {
            console.warn('No order details found in refreshed order');
          }
          
          console.log('Order data after refresh:', this.order);
          
          // Khởi tạo dữ liệu form update từ order
          this.initUpdateForm();
          
          alert('Order data refreshed successfully');
        } else {
          console.error('Order data is null or undefined after refresh');
          alert('Failed to refresh order data. Please try again.');
        }
      },
      error: (error: any) => {
        console.error('Error refreshing order data:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        alert('Error refreshing order details. Please try again.');
      }
    });
  }
} 