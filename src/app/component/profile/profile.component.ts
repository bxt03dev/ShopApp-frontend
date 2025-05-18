import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../service/user.service';
import { UserResponse } from '../../response/user/user.response';
import { UpdateUserDTO } from '../../dto/user/update-user.dto';
import { TokenService } from '../../service/token.service';
import { Router } from '@angular/router';
import { CustomToastService } from '../../service/custom-toast.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userForm: FormGroup;
  passwordForm: FormGroup;
  userData: UserResponse | null;
  isLoading = false;
  isPasswordLoading = false;
  showPassword = false;
  showNewPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private tokenService: TokenService,
    private router: Router,
    private toastService: CustomToastService
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: [''],
      email: ['', [Validators.email]],
      dateOfBirth: ['']
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      retypePassword: ['', [Validators.required]]
    }, { validator: this.checkPasswords });

    this.userData = this.userService.getUserResponseFromLocalStorage();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.userData = this.userService.getUserResponseFromLocalStorage();
    if (!this.userData) {
      this.router.navigate(['/login']);
      return;
    }

    // Populate form with user data
    this.userForm.patchValue({
      fullName: this.userData.fullName,
      phoneNumber: this.userData.phoneNumber || '',
      address: this.userData.address || '',
      email: this.userData.email || '',
      dateOfBirth: this.userData.dateOfBirth ? new Date(this.userData.dateOfBirth) : ''
    });
  }

  checkPasswords(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const retypePassword = group.get('retypePassword')?.value;
    return newPassword === retypePassword ? null : { notMatching: true };
  }

  updateProfile(): void {
    if (this.userForm.invalid) {
      this.toastService.showError('Vui lòng sửa các lỗi trong biểu mẫu');
      return;
    }

    this.isLoading = true;
    const token = this.tokenService.getToken();
    if (!token || !this.userData?.id) {
      this.toastService.showError('Lỗi xác thực. Vui lòng đăng nhập lại.');
      this.router.navigate(['/login']);
      return;
    }

    const updateData = new UpdateUserDTO(this.userForm.value);
    
    this.userService.updateUserProfile(this.userData.id, updateData, token).subscribe({
      next: (response) => {
        if (response.result) {
          // Update local storage with new user data
          this.userService.saveUserResponseToLocalStorage(response.result);
          this.userData = response.result;
          this.toastService.showSuccess('Cập nhật hồ sơ thành công');
        } else {
          this.toastService.showError('Không thể cập nhật hồ sơ');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showError(error.message || 'Không thể cập nhật hồ sơ');
        this.isLoading = false;
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.toastService.showError('Vui lòng sửa các lỗi trong biểu mẫu');
      return;
    }

    if (this.passwordForm.hasError('notMatching')) {
      this.toastService.showError('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    this.isPasswordLoading = true;
    const token = this.tokenService.getToken();
    if (!token || !this.userData?.id) {
      this.toastService.showError('Lỗi xác thực. Vui lòng đăng nhập lại.');
      this.router.navigate(['/login']);
      return;
    }

    // Correct the password update data structure
    const passwordData = new UpdateUserDTO({
      password: this.passwordForm.value.newPassword,
      retypePassword: this.passwordForm.value.retypePassword
    });

    this.userService.updateUserProfile(this.userData.id, passwordData, token).subscribe({
      next: (response) => {
        if (response.result) {
          this.toastService.showSuccess('Cập nhật mật khẩu thành công');
          this.passwordForm.reset();
        } else {
          this.toastService.showError('Không thể cập nhật mật khẩu');
        }
        this.isPasswordLoading = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Không thể cập nhật mật khẩu';
        this.toastService.showError(errorMessage);
        this.isPasswordLoading = false;
      }
    });
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }
}
