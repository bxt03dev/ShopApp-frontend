import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LoginDTO } from '../../dto/user/login.dto';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { LoginResponse } from '../../response/user/login.response';
import { TokenService } from '../../service/token.service';
import { UserResponse } from '../../response/user/user.response';
import { CustomToastService } from '../../service/custom-toast.service';
import { CartService } from '../../service/cart.service';
import { SocialLoginDTO } from '../../dto/user/social-login.dto';

// Add Google Sign-In library type
declare var google: any;

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
  googleAuthURL: string = '';
  facebookAuthURL: string = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private tokenService: TokenService,
    private cartService: CartService,
    private customToast: CustomToastService
  ) {}

  ngOnInit(): void {
    // Generate the auth URLs
    this.googleAuthURL = this.userService.generateGoogleAuthUrl();
    this.facebookAuthURL = this.userService.generateFacebookAuthUrl();
    
    // If the URL contains a 'code' parameter, it means we are redirected back from OAuth provider
    this.handleOAuthRedirect();
  }

  private handleOAuthRedirect(): void {
    // Check URL for authentication parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const accessToken = urlParams.get('accessToken');
    // Detect if we're in a Facebook callback based on state parameter or URL path
    const pathSegments = window.location.pathname.split('/');
    const isFromFacebook = pathSegments.includes('facebook') || 
                          window.location.href.includes('facebook') ||
                          (urlParams.get('state') && urlParams.get('state')?.includes('facebook'));
    
    if (accessToken) {
      // Clear the URL to remove the parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const socialLoginDTO: SocialLoginDTO = {
        accessToken: accessToken,
        provider: isFromFacebook ? 'facebook' : 'google'
      };
      
      if (isFromFacebook) {
        this.processFacebookLogin(socialLoginDTO);
      } else {
        this.processGoogleLogin(socialLoginDTO);
      }
    }
    else if (code) {
      // Clear the URL to remove the parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (isFromFacebook) {
        const socialLoginDTO: SocialLoginDTO = {
          code: code,
          provider: 'facebook',
          redirectUri: 'http://localhost:8080/api/v1/auth/oauth2/callback/facebook'
        };
        this.processFacebookLogin(socialLoginDTO);
      } else {
        const socialLoginDTO: SocialLoginDTO = {
          code: code,
          provider: 'google',
          redirectUri: 'http://localhost:8080/api/v1/auth/oauth2/callback/google'
        };
        this.processGoogleLogin(socialLoginDTO);
      }
    }
  }

  private processGoogleLogin(socialLoginDTO: SocialLoginDTO): void {
    this.userService.googleLogin(socialLoginDTO).subscribe({
      next: (response) => {
        if (response && response.success && response.accessToken) {
          const token = response.accessToken;
          this.tokenService.setToken(token, this.rememberMe);
          
          // Get user details
          this.userService.getUserDetail(token).subscribe({
            next: (userResponse) => {
              const user = userResponse.result;
              this.userService.saveUserResponseToLocalStorage(user);
              this.cartService.loadCart();
              this.customToast.showAuthSuccess('Đăng nhập Google thành công!', 'Thông báo');
              
              if (user.role.name === 'ADMIN') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: (error) => {
              console.error("Error getting user details:", error);
              this.customToast.showAuthError('Lỗi khi lấy thông tin người dùng', 'Lỗi');
            }
          });
        } else {
          console.error("Invalid login response:", response);
          this.customToast.showAuthError('Đăng nhập thất bại: Không tìm thấy token', 'Lỗi');
        }
      },
      error: (error) => {
        console.error('Google login error:', error);
        this.customToast.showAuthError('Đăng nhập Google thất bại', 'Lỗi');
      }
    });
  }

  onPhoneNumberChange() {
    console.log(`Phone typed: ${this.phoneNumber}`);
  }

  onLogin() {
    if (!this.loginForm.valid) {
      this.customToast.showAuthWarning('Vui lòng điền đầy đủ thông tin.', 'Cảnh báo');
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
              this.cartService.loadCart(); // Load cart after successful login
              this.customToast.showAuthSuccess('Đăng nhập thành công!', 'Thông báo');
              
              // Điều hướng dựa trên role
              if (userResponse.role.name === 'ADMIN') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: (error) => {
              this.customToast.showAuthError('Lỗi khi lấy thông tin người dùng', 'Lỗi');
            }
          });
        } else {
          this.customToast.showAuthError('Đăng nhập thất bại: Không tìm thấy token', 'Lỗi');
        }
      },
      error: (error: any) => {
        const errorResponse = error.error as LoginResponse;
        const errorMessage = errorResponse?.message || 'Lỗi server';
        const errorCode = errorResponse?.code || 0;
        if (errorCode === 1001) {
          this.customToast.showAuthError('Số điện thoại hoặc mật khẩu không đúng', 'Lỗi');
        } else {
          this.customToast.showAuthError(`Đăng nhập thất bại: ${errorMessage}`, 'Lỗi');
        }
      }
    });
  }

  onGoogleLogin() {
    // Redirect to Google authorization URL
    window.location.href = this.googleAuthURL;
  }

  onFacebookLogin() {
    // Redirect to Facebook authorization URL
    window.location.href = this.facebookAuthURL;
  }

  private processFacebookLogin(socialLoginDTO: SocialLoginDTO): void {
    this.userService.facebookLogin(socialLoginDTO).subscribe({
      next: (response) => {
        if (response && response.success && response.accessToken) {
          const token = response.accessToken;
          this.tokenService.setToken(token, this.rememberMe);
          
          // Get user details
          this.userService.getUserDetail(token).subscribe({
            next: (userResponse) => {
              const user = userResponse.result;
              this.userService.saveUserResponseToLocalStorage(user);
              this.cartService.loadCart();
              this.customToast.showAuthSuccess('Đăng nhập Facebook thành công!', 'Thông báo');
              
              if (user.role.name === 'ADMIN') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: (error) => {
              console.error("Error getting user details:", error);
              this.customToast.showAuthError('Lỗi khi lấy thông tin người dùng', 'Lỗi');
            }
          });
        } else {
          console.error("Invalid login response:", response);
          this.customToast.showAuthError('Đăng nhập thất bại: Không tìm thấy token', 'Lỗi');
        }
      },
      error: (error) => {
        console.error('Facebook login error:', error);
        this.customToast.showAuthError('Đăng nhập Facebook thất bại', 'Lỗi');
      }
    });
  }
}
