import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LoginDTO } from '../../dto/user/login.dto';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { LoginResponse } from '../../response/user/login.response';
import { TokenService } from '../../service/token.service';

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
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {}

  onPhoneNumberChange() {
    console.log(`Phone typed: ${this.phoneNumber}`);
  }

  onLogin() {
    if (!this.loginForm.valid) {
      alert('Please fill in all required fields.');
      return;
    }

    const loginDTO: LoginDTO = {
      phoneNumber: this.phoneNumber,
      password: this.password,
    };

    this.userService.login(loginDTO).subscribe({
      next: (response: LoginResponse) => {
        console.log('Response:', response);
        const { result } = response;
        if (result) {
          this.tokenService.setToken(result, this.rememberMe);
          console.log('Stored token:', this.tokenService.getToken());
          this.router.navigate(['/']);
        } else {
          console.error('Result is undefined or null');
          alert('Login failed: Token not found in response');
        }
      },
      error: (error: any) => {
        const errorResponse = error.error as LoginResponse;
        const errorMessage = errorResponse?.message || 'Server error';
        const errorCode = errorResponse?.code || 0;
        if (errorCode === 1001) {
          alert('Invalid phone number or password');
        } else {
          alert(`Login failed: ${errorMessage}`);
        }
      }
    });
  }
}
