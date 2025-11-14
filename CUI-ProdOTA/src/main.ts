import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ApiService } from './app/services/api.service';



window.onerror = (message, source, lineno, colno, error) => {
  // console.error(`Global JS Error: `,);
  try {
    // ApiService.saveLogs(JSON.stringify(`Global JS Error:' :${{ message, source, lineno, colno, error }}`))
  } catch (error) {

  }
  // Show toast or log
  return true; // prevents default error logging
};


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
