import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StockPageRoutingModule } from './stock-routing.module';

import { StockPage } from './stock.page';
// import {FilterByPipe} from 'ngx-pipes';
import { HmCacheImgDirective } from '../hm-cache-img.directive';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StockPageRoutingModule,
    HmCacheImgDirective
  ],
  declarations: [StockPage],
  providers:[
    // FilterByPipe
  ]
})
export class StockPageModule {}
