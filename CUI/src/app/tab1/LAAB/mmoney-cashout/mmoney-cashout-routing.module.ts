import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MmoneyCashoutPage } from './mmoney-cashout.page';

const routes: Routes = [
  {
    path: '',
    component: MmoneyCashoutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MmoneyCashoutPageRoutingModule {}
