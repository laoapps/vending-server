import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StocksalePageRoutingModule } from './stocksale-routing.module';

import { StocksalePage } from './stocksale.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StocksalePageRoutingModule
  ],
  declarations: [StocksalePage]
})
export class StocksalePageModule {}
