import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpinCashOutPage } from './epin-cash-out.page';

const routes: Routes = [
  {
    path: '',
    component: EpinCashOutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpinCashOutPageRoutingModule {}
