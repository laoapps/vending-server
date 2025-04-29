import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StocksalePage } from './stocksale.page';

const routes: Routes = [
  {
    path: '',
    component: StocksalePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StocksalePageRoutingModule {}
