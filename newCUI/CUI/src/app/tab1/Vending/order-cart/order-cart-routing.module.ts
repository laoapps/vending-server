import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderCartPage } from './order-cart.page';

const routes: Routes = [
  {
    path: '',
    component: OrderCartPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderCartPageRoutingModule {}
