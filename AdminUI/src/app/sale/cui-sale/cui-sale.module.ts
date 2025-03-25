import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CuiSalePageRoutingModule } from './cui-sale-routing.module';

import { CuiSalePage } from './cui-sale.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CuiSalePageRoutingModule
  ],
  declarations: [CuiSalePage]
})
export class CuiSalePageModule {}
