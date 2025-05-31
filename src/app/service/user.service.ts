import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {RegisterDTO} from "../dto/user/register.dto";
import {environment} from "../common/environment";
import {LoginDTO} from "../dto/user/login.dto";
import {UserResponse} from "../response/user/user.response";
import { Subscription } from 'rxjs';
import { SocialLoginDTO } from "../dto/user/social-login.dto";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USER_KEY = 'user_info';
  private apiRegister = `${environment.apiBaseUrl}/users/register`;
  private apiLogin = `${environment.apiBaseUrl}/users/login`;
  private apiUserDetail = `${environment.apiBaseUrl}/users/details`;
  private apiUpdateUser = `${environment.apiBaseUrl}/users/details`;
  private apiGoogleLogin = `${environment.apiBaseUrl}/auth/google`;
  private apiFacebookLogin = `${environment.apiBaseUrl}/auth/facebook`;
  private apiGetAllUsers = `${environment.apiBaseUrl}/users`;
  private apiUpdateUserActive = `${environment.apiBaseUrl}/users`;
  private apiConfig = {
    headers: this.createHeaders()
  }

  constructor(private http: HttpClient) { }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  register(registerDTO: RegisterDTO): Observable<any> {
    return this.http.post(this.apiRegister, registerDTO, this.apiConfig);
  }

  login(loginDTO: LoginDTO): Observable<any> {
    return this.http.post(this.apiLogin, loginDTO, this.apiConfig);
  }

  googleLogin(socialLoginDTO: SocialLoginDTO): Observable<any> {
    return this.http.post(this.apiGoogleLogin, socialLoginDTO, this.apiConfig);
  }

  facebookLogin(socialLoginDTO: SocialLoginDTO): Observable<any> {
    return this.http.post(this.apiFacebookLogin, socialLoginDTO, this.apiConfig);
  }

  generateGoogleAuthUrl(): string {
    const clientId = '530836479470-2kj9t38qda22n3rsdpjvq0nf6dpktpu5.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:8080/api/v1/auth/oauth2/callback/google');
    const scope = encodeURIComponent('email profile');
    const responseType = 'code';
    const state = encodeURIComponent(window.location.href); // Store current URL to return after login

    return `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;
  }

  generateFacebookAuthUrl(): string {
    const clientId = '1809162579958139';
    const redirectUri = encodeURIComponent('http://localhost:8080/api/v1/auth/oauth2/callback/facebook');
    const scope = encodeURIComponent('email');
    const responseType = 'code';
    const state = encodeURIComponent(window.location.href); // Store current URL to return after login

    return `https://www.facebook.com/v17.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;
  }

  getUserDetail(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Use only headers as the options, not as the body
    return this.http.post(this.apiUserDetail, {}, { headers });
  }

  updateUserProfile(userId: number, updateData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(`${this.apiUpdateUser}/${userId}`, updateData, { headers });
  }

  saveUserResponseToLocalStorage(userResponse: UserResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(userResponse));
  }

  getUserResponseFromLocalStorage(): UserResponse | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserResponse;
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        return null;
      }
    }
    return null;
  }

  removeUserFromLocalStorage(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  getAllUsers(token: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(this.apiGetAllUsers, { headers });
  }

  updateUserActive(userId: number, active: boolean, token: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.patch<any>(`${this.apiUpdateUserActive}/${userId}/active`, active, { headers });
  }
}
