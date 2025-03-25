import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderPaidPage } from './order-paid.page';

const routes: Routes = [
  {
    path: '',
    component: OrderPaidPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderPaidPageRoutingModule {}
