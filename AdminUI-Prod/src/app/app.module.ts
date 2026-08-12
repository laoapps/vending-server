import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { NotifierModule } from 'angular-notifier';
import { IonicStorageModule } from '@ionic/storage-angular';
import { PaidOrdersModalComponent } from './modals/paid-orders-modal/paid-orders-modal.component';
import { PickLocationModalComponent } from './modals/pick-location-modal/pick-location-modal.component';
import { PhoneSecretDialogComponent } from './modals/phone-secret-dialog/phone-secret-dialog.component';
import { TicketDetailModalComponent } from './ticket-detail-modal/ticket-detail-modal.component';
// import { Storage } from '@ionic/storage';

@NgModule({
  declarations: [AppComponent, PaidOrdersModalComponent, PickLocationModalComponent, PhoneSecretDialogComponent, TicketDetailModalComponent],
  imports: [BrowserModule, FormsModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, NotifierModule, IonicStorageModule.forRoot()],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
