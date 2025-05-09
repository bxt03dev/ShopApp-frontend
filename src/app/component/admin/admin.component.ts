import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../../service/token.service';
import { UserService } from '../../service/user.service';
import {CustomToastService} from "../../service/custom-toast.service";


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  constructor(
    private router: Router,
    private tokenService: TokenService,
    private userService: UserService,
    private toastService: CustomToastService
  ) {}

  logout() {
    // Sử dụng TokenService để xóa token
    this.tokenService.removeToken();
    // Xóa thông tin người dùng
    this.userService.removeUserFromLocalStorage();
    // Thông báo
    this.toastService.showAuthSuccess('Đăng xuất thành công!', 'Thông báo');
    // Chuyển hướng về trang chính
    this.router.navigate(['/']);
  }
}
