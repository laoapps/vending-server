import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetailControlOrderPage } from './detail-control-order.page';

const routes: Routes = [
  {
    path: '',
    component: DetailControlOrderPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetailControlOrderPageRoutingModule {}
