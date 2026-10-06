import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StocksalePageRoutingModule } from './stocksale-routing.module';

import { StocksalePage } from './stocksale.page';
import { HmCacheImgDirective } from '../hm-cache-img.directive';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StocksalePageRoutingModule,
    HmCacheImgDirective
  ],
  declarations: [StocksalePage]
})
export class StocksalePageModule {}
