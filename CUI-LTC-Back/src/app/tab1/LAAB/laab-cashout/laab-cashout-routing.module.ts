import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaabCashoutPage } from './laab-cashout.page';

const routes: Routes = [
  {
    path: '',
    component: LaabCashoutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaabCashoutPageRoutingModule {}
