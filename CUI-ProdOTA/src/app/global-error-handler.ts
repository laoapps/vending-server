import { ErrorHandler, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';
import { ApiService } from './services/api.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  handleError(error: any): void {
    const message = error?.message || 'An unexpected error occurred';

    // Log to console (for dev)
    console.error('Global Error:', error);

    // Show user-friendly message (optional)
    // this.showErrorToast(message);

    try {
      ApiService.saveLogs(JSON.stringify(message))
    } catch (error) {

    }


    // Optional: Send to analytics / crash reporting
    // e.g., Sentry.captureException(error);
  }


}