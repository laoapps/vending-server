import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AutoPaymentTopUpPageRoutingModule } from './auto-payment-top-up-routing.module';

import { AutoPaymentTopUpPage } from './auto-payment-top-up.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AutoPaymentTopUpPageRoutingModule
  ],
  declarations: [AutoPaymentTopUpPage]
})
export class AutoPaymentTopUpPageModule {}
