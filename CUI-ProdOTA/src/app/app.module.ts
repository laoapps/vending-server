import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { QrCodeModule } from 'ng-qrcode';
// import { NotifierModule } from 'angular-notifier';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';
import { OrderModule } from 'ngx-order-pipe';

import { JsonPipe } from '@angular/common';
import { NgPipesModule } from 'ngx-pipes';
import { GlobalErrorHandler } from './global-error-handler';
import { HttpErrorInterceptor } from './http-error.interceptor';

// today
// import { VideoPlayer } from '@ionic-native/video-player/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot({ innerHTMLTemplatesEnabled: true }), AppRoutingModule, HttpClientModule, QrCodeModule, JsonPipe,
    // NotifierModule,
    OrderModule,
    NgPipesModule,
    IonicStorageModule.forRoot(),
  ],
  providers: [
    // VideoPlayer,
    // BarcodeScanner,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, Storage,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
