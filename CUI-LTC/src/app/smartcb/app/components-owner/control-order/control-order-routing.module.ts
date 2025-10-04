import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ControlOrderPage } from './control-order.page';

const routes: Routes = [
  {
    path: '',
    component: ControlOrderPage
  },
  {
    path: 'detail-control-order',
    loadChildren: () => import('./detail-control-order/detail-control-order.module').then( m => m.DetailControlOrderPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ControlOrderPageRoutingModule {}
