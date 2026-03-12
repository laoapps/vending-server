import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrintReceiptPageRoutingModule } from './print-receipt-routing.module';

import { PrintReceiptPage } from './print-receipt.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrintReceiptPageRoutingModule
  ],
  declarations: [PrintReceiptPage]
})
export class PrintReceiptPageModule {}
