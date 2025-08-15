import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CqrPaymentPageRoutingModule } from './cqr-payment-routing.module';

import { CqrPaymentPage } from './cqr-payment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CqrPaymentPageRoutingModule
  ],
  declarations: [CqrPaymentPage]
})
export class CqrPaymentPageModule {}
