import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StackCashoutPage } from './stack-cashout.page';

const routes: Routes = [
  {
    path: '',
    component: StackCashoutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StackCashoutPageRoutingModule {}
