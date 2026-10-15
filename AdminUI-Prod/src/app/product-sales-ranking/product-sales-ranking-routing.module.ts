import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductSalesRankingPage } from './product-sales-ranking.page';

const routes: Routes = [
  {
    path: '',
    component: ProductSalesRankingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductSalesRankingPageRoutingModule {}
