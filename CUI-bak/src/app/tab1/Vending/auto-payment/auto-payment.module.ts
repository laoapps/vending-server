import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AutoPaymentPageRoutingModule } from './auto-payment-routing.module';

import { AutoPaymentPage } from './auto-payment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AutoPaymentPageRoutingModule
  ],
  declarations: [AutoPaymentPage]
})
export class AutoPaymentPageModule {}
