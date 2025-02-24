import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhonePaymentPageRoutingModule } from './phone-payment-routing.module';

import { PhonePaymentPage } from './phone-payment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PhonePaymentPageRoutingModule
  ],
  declarations: [PhonePaymentPage]
})
export class PhonePaymentPageModule {}
