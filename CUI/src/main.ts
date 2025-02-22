import './polyfills';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { CapacitorUpdater, DownloadEvent } from '@capgo/capacitor-updater';
import { ApiService } from './app/services/api.service';


CapacitorUpdater.notifyAppReady();


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
