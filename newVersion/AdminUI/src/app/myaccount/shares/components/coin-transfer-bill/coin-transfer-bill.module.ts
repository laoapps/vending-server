import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CoinTransferBillPageRoutingModule } from './coin-transfer-bill-routing.module';

import { CoinTransferBillPage } from './coin-transfer-bill.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoinTransferBillPageRoutingModule
  ],
  declarations: [CoinTransferBillPage]
})
export class CoinTransferBillPageModule {}
