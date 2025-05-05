import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'access_token';
  private jwtHelperService = new JwtHelperService()

  constructor() {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string, rememberMe: boolean = false): void {
    if (!token || token.trim() === '') {
      console.error('Cannot set empty or invalid token');
      return;
    }

    if (rememberMe) {
      localStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.removeItem(this.TOKEN_KEY);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY); // Thêm xóa sessionStorage
  }

  getUserId(): number {
    let token = this.getToken()
    if (!token) {
      return 0
    }
    let userObject = this.jwtHelperService.decodeToken(token)
    return 'userId' in userObject ? parseInt(userObject['userId']) : 0
  }
  isTokenExpired(): boolean {
    if (this.getToken() == null) {
      return false
    }
    return this.jwtHelperService.isTokenExpired(this.getToken()!)
  }
}
