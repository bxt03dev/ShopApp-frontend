import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CustomToastService {
  constructor(private toastr: ToastrService) {}

  // Auth notifications (bottom right)
  showAuthSuccess(message: string, title: string = 'Thông báo') {
    this.toastr.success(message, title, {
      positionClass: 'toast-bottom-right'
    });
  }

  showAuthError(message: string, title: string = 'Lỗi') {
    this.toastr.error(message, title, {
      positionClass: 'toast-bottom-right'
    });
  }

  showAuthWarning(message: string, title: string = 'Cảnh báo') {
    this.toastr.warning(message, title, {
      positionClass: 'toast-bottom-right'
    });
  }

  showAuthInfo(message: string, title: string = 'Thông tin') {
    this.toastr.info(message, title, {
      positionClass: 'toast-bottom-right'
    });
  }

  // Confirmation/Delete notifications (center)
  showDeleteSuccess(message: string, title: string = 'Thông báo') {
    this.toastr.success(message, title, {
      positionClass: 'toast-center'
    });
  }

  showDeleteError(message: string, title: string = 'Lỗi') {
    this.toastr.error(message, title, {
      positionClass: 'toast-center'
    });
  }

  showDeleteWarning(message: string, title: string = 'Cảnh báo') {
    this.toastr.warning(message, title, {
      positionClass: 'toast-center'
    });
  }

  showDeleteInfo(message: string, title: string = 'Thông tin') {
    this.toastr.info(message, title, {
      positionClass: 'toast-center'
    });
  }

  // Thêm phương thức mới cho xác nhận
  showConfirmSuccess(message: string, title: string = 'Thông báo') {
    this.toastr.success(message, title, {
      positionClass: 'toast-center'
    });
  }

  showConfirmError(message: string, title: string = 'Lỗi') {
    this.toastr.error(message, title, {
      positionClass: 'toast-center'
    });
  }

  showConfirmWarning(message: string, title: string = 'Cảnh báo') {
    this.toastr.warning(message, title, {
      positionClass: 'toast-center'
    });
  }

  showConfirmInfo(message: string, title: string = 'Thông tin') {
    this.toastr.info(message, title, {
      positionClass: 'toast-center'
    });
  }

  // Standard notifications - mặc định sẽ đi theo cấu hình toastr, không cần thêm options
  showSuccess(message: string, title: string = 'Thông báo') {
    this.toastr.success(message, title);
  }

  showError(message: string, title: string = 'Lỗi') {
    this.toastr.error(message, title);
  }

  showWarning(message: string, title: string = 'Cảnh báo') {
    this.toastr.warning(message, title);
  }

  showInfo(message: string, title: string = 'Thông tin') {
    this.toastr.info(message, title);
  }
} 