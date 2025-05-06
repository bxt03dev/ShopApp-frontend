import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {RegisterDTO} from "../dto/user/register.dto";
import {environment} from "../common/environment";
import {LoginDTO} from "../dto/user/login.dto";
import {UserResponse} from "../response/user/user.response";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  localStorage?: Storage
  private apiRegister = `${environment.apiBaseUrl}/users/register`;
  private apiLogin = `${environment.apiBaseUrl}/users/login`;
  private apiUserDetail = `${environment.apiBaseUrl}/users/details`
  private apiConfig = {
    headers: this.createHeaders()
  }

  constructor(private http: HttpClient) { }
  private createHeaders(): HttpHeaders{
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US'
    })
  }
  register(registerDTO: RegisterDTO):Observable<any>{
    return this.http.post(this.apiRegister, registerDTO, this.apiConfig);
  }

  login(loginDTO: LoginDTO): Observable<any> {
    return this.http.post(this.apiLogin, loginDTO, this.apiConfig);
  }

  getUserDetail(token: string) {
    return this.http.post<{ code: number, message: string, result: UserResponse }>(this.apiUserDetail, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    });
  }

  saveUserResponseToLocalStorage(userResponse?: UserResponse) {
    try {
      // debugger
      if (userResponse == null || !userResponse) {
        return
      }
      // Convert the userResponse object to a JSON string
      const userResponseJSON = JSON.stringify(userResponse)
      // Save the JSON string to local storage with a key (e.g., "userResponse")
      debugger
      this.localStorage?.setItem('user', userResponseJSON)
      console.log('User response saved to local storage.')
    } catch (error) {
      console.error('Error saving user response to local storage:', error)
    }
  }

  getUserResponseFromLocalStorage(): UserResponse | null {
    try {
      const userResponseJSON = this.localStorage?.getItem('user')
      if (userResponseJSON == null) {
        return null
      }
      const userResponse = JSON.parse(userResponseJSON!)
      console.log('User response retrieved from local storage.')
      return userResponse
    } catch (error) {
      console.error('Error retrieving user response from local storage:', error)
      return null
    }
  }

  removeUserFromLocalStorage(): void {
    try {
      this.localStorage?.removeItem('user')
      console.log('User data removed from local storage.')
    } catch (error) {
      console.error('Error removing user data from local storage:', error)
    }
  }
}
