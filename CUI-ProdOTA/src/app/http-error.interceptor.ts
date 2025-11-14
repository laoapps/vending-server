import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Toast } from '@capacitor/toast';
import { ApiService } from './services/api.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'Network error. Please try again.';
        if (error.error instanceof ErrorEvent) {
          errorMsg = `Error: ${error.error.message}`;
        } else {
          errorMsg = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }

        // console.error('HTTP Error:', error);
        // this.showToast(errorMsg);
        try {
          // ApiService.saveLogs(JSON.stringify(errorMsg))
        } catch (error) {

        }

        return throwError(() => error);
      })
    );
  }

  private async showToast(msg: string) {
    await Toast.show({ text: msg, duration: 'long' });
  }
}