import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductSalesRankingPageRoutingModule } from './product-sales-ranking-routing.module';

import { ProductSalesRankingPage } from './product-sales-ranking.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductSalesRankingPageRoutingModule
  ],
  declarations: [ProductSalesRankingPage]
})
export class ProductSalesRankingPageModule {}
