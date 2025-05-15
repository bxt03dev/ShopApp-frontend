import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse} from "@angular/common/http";
import {Observable, throwError, BehaviorSubject} from "rxjs";
import {TokenService} from "../service/token.service";
import {catchError, filter, switchMap, take, finalize} from "rxjs/operators";
import {Router} from "@angular/router";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenService.getToken();

    // Check if we have a token
    if (token) {
      // Check if token is expired
      if (this.tokenService.isTokenExpired()) {
        // Token is expired, remove it and redirect to login
        console.log('Token is expired, removing from storage');
        this.tokenService.removeToken();
        
        // Only redirect to login if this is not already a login request
        if (!req.url.includes('/auth/login')) {
          this.router.navigate(['/login']);
          return throwError(() => new Error('Session expired. Please login again.'));
        }
      } else {
        // Token is valid, add it to the request
        req = this.addToken(req, token);
      }
    }

    // Handle the response
    return next.handle(req).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          console.error(`Auth error ${error.status} on ${req.url}:`, error);
          
          // Handle authentication errors (401 or 403)
          // For simplicity in this implementation, just clear token and redirect
          if (!req.url.includes('/auth/login')) {
            this.tokenService.removeToken();
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
