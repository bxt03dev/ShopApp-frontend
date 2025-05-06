import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LoginDTO } from '../../dto/user/login.dto';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { LoginResponse } from '../../response/user/login.response';
import { TokenService } from '../../service/token.service';
import { UserResponse } from '../../response/user/user.response';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  @ViewChild('loginForm') loginForm!: NgForm;
  phoneNumber: string = '0886249250';
  password: string = 'hehee';
  rememberMe: boolean = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private tokenService: TokenService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

  onPhoneNumberChange() {
    console.log(`Phone typed: ${this.phoneNumber}`);
  }

  onLogin() {
    if (!this.loginForm.valid) {
      this.toastr.warning('Vui lòng điền đầy đủ thông tin.', 'Cảnh báo');
      return;
    }

    const loginDTO: LoginDTO = {
      phoneNumber: this.phoneNumber,
      password: this.password,
    };

    this.userService.login(loginDTO).subscribe({
      next: (response: LoginResponse) => {
        const { result } = response;
        if (result) {
          this.tokenService.setToken(result, this.rememberMe);
          
          // Get user details after successful login
          this.userService.getUserDetail(result).subscribe({
            next: (response) => {
              const userResponse = response.result;
              this.userService.saveUserResponseToLocalStorage(userResponse);
              this.toastr.success('Đăng nhập thành công!', 'Thông báo');
              this.router.navigate(['/']);
            },
            error: (error) => {
              this.toastr.error('Lỗi khi lấy thông tin người dùng', 'Lỗi');
            }
          });
        } else {
          this.toastr.error('Đăng nhập thất bại: Không tìm thấy token', 'Lỗi');
        }
      },
      error: (error: any) => {
        const errorResponse = error.error as LoginResponse;
        const errorMessage = errorResponse?.message || 'Lỗi server';
        const errorCode = errorResponse?.code || 0;
        if (errorCode === 1001) {
          this.toastr.error('Số điện thoại hoặc mật khẩu không đúng', 'Lỗi');
        } else {
          this.toastr.error(`Đăng nhập thất bại: ${errorMessage}`, 'Lỗi');
        }
      }
    });
  }
}
