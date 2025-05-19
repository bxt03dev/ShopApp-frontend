import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {RegisterDTO} from "../dto/user/register.dto";
import {environment} from "../common/environment";
import {LoginDTO} from "../dto/user/login.dto";
import {UserResponse} from "../response/user/user.response";
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USER_KEY = 'user_info';
  private apiRegister = `${environment.apiBaseUrl}/users/register`;
  private apiLogin = `${environment.apiBaseUrl}/users/login`;
  private apiUserDetail = `${environment.apiBaseUrl}/users/details`;
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

  getUserDetail(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.apiUserDetail, { headers });
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
}
