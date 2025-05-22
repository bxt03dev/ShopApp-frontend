import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { TokenService } from '../../service/token.service';
import { CustomToastService } from '../../service/custom-toast.service';
import { CartService } from '../../service/cart.service';
import { SocialLoginDTO } from '../../dto/user/social-login.dto';

@Component({
  selector: 'app-oauth-callback',
  template: '<div class="d-flex justify-content-center mt-5 pt-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>'
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private tokenService: TokenService,
    private customToast: CustomToastService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const { accessToken, code, state, error } = params;
      
      if (error) {
        this.customToast.showAuthError(`Authentication failed: ${error}`, 'Error');
        this.router.navigate(['/login']);
        return;
      }
      
      // Determine provider from current URL
      const currentUrl = this.router.url;
      const provider = currentUrl.includes('google') ? 'google' : 'facebook';
      
      // If we received an accessToken directly, use it
      if (accessToken) {
        console.log("Using access token directly from URL");
        const socialLoginDTO: SocialLoginDTO = {
          accessToken: accessToken,
          provider: provider
        };
        
        this.processLogin(socialLoginDTO);
      }
      // Otherwise fall back to code flow if code is available
      else if (code) {
        console.log("Using authorization code flow");
        const redirectUri = provider === 'google' 
          ? 'http://localhost:8080/api/v1/auth/oauth2/callback/google' 
          : 'http://localhost:8080/api/v1/auth/oauth2/callback/facebook';
        
        const socialLoginDTO: SocialLoginDTO = {
          code: code,
          provider: provider,
          redirectUri: redirectUri
        };
        
        this.processLogin(socialLoginDTO);
      } 
      else {
        this.customToast.showAuthError('No authentication credentials received', 'Error');
        this.router.navigate(['/login']);
      }
    });
  }

  private processLogin(socialLoginDTO: SocialLoginDTO): void {
    if (socialLoginDTO.provider === 'google') {
      this.userService.googleLogin(socialLoginDTO).subscribe({
        next: this.handleLoginSuccess.bind(this),
        error: this.handleLoginError.bind(this)
      });
    } else {
      this.userService.facebookLogin(socialLoginDTO).subscribe({
        next: this.handleLoginSuccess.bind(this),
        error: this.handleLoginError.bind(this)
      });
    }
  }

  private handleLoginSuccess(response: any): void {
    if (response && response.success && response.accessToken) {
      console.log("Login successful, got token");
      const token = response.accessToken;
      this.tokenService.setToken(token, true);
      
      this.userService.getUserDetail(token).subscribe({
        next: (userResponse) => {
          const user = userResponse.result;
          this.userService.saveUserResponseToLocalStorage(user);
          this.cartService.loadCart();
          this.customToast.showAuthSuccess('Đăng nhập thành công!', 'Thành công');
          
          if (user.role.name === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Error getting user details:', error);
          this.customToast.showAuthError('Lỗi khi lấy thông tin người dùng', 'Lỗi');
          this.router.navigate(['/login']);
        }
      });
    } else {
      console.error('Login failed: Invalid response format', response);
      this.customToast.showAuthError('Đăng nhập thất bại: Không tìm thấy token', 'Lỗi');
      this.router.navigate(['/login']);
    }
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    this.customToast.showAuthError('Đăng nhập thất bại', 'Lỗi');
    this.router.navigate(['/login']);
  }
} 