import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { QrCodeModule } from 'ng-qrcode';
// import { NotifierModule } from 'angular-notifier';
import { Storage } from '@ionic/storage-angular';
import { OrderModule } from 'ngx-order-pipe';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { NgParticlesModule } from "ng-particles";
import {NgPipesModule} from 'ngx-pipes';

// today
import { VideoPlayer } from '@ionic-native/video-player/ngx';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,HttpClientModule,QrCodeModule,
    // NotifierModule,
     OrderModule,NgParticlesModule,
     NgPipesModule
  ],
  providers: [ 
    VideoPlayer,
    // BarcodeScanner,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },Storage,AppVersion],
  bootstrap: [AppComponent],
})
export class AppModule {}
