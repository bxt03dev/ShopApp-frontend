import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { TokenService } from '../service/token.service';
import { UserService } from '../service/user.service';
import { UserResponse } from '../response/user/user.response';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
    userResponse?: UserResponse | null

    constructor(
      private tokenService: TokenService,
      private router: Router,
      private userService: UserService
    ) {
    }

    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
      const isTokenExpired = this.tokenService.isTokenExpired()
      const isUserIdValid = this.tokenService.getUserId() > 0
      this.userResponse = this.userService.getUserResponseFromLocalStorage()
      const isAdmin = this.userResponse?.role.name === 'ADMIN'

      if (!isTokenExpired && isUserIdValid && isAdmin) {
        return true
      } else {
        this.router.navigate(['/login'])
        return false
      }
    }
  }

