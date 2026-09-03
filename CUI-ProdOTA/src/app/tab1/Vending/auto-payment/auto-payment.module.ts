import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AutoPaymentPage } from './auto-payment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [AutoPaymentPage],
  exports: [AutoPaymentPage]
})
export class AutoPaymentPageModule {}
