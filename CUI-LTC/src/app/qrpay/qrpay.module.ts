import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QrpayPageRoutingModule } from './qrpay-routing.module';

import { QrpayPage } from './qrpay.page';
import { QrCodeModule } from 'ng-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrpayPageRoutingModule,
    QrCodeModule
  ],
  declarations: [QrpayPage]
})
export class QrpayPageModule {}
