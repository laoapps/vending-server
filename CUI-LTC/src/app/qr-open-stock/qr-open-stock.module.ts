import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QrOpenStockPageRoutingModule } from './qr-open-stock-routing.module';

import { QrOpenStockPage } from './qr-open-stock.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrOpenStockPageRoutingModule
  ],
  declarations: [QrOpenStockPage]
})
export class QrOpenStockPageModule {}
