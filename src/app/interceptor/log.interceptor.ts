import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LogInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Log the outgoing request
    console.log('Outgoing HTTP request', {
      url: request.url,
      method: request.method,
      body: request.body
    });

    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Log the response
          console.log('HTTP response', {
            url: event.url,
            status: event.status,
            body: event.body
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Log any HTTP errors
        console.error('HTTP error', {
          url: request.url,
          status: error.status,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }
} 