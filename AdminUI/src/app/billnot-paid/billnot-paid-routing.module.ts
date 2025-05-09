import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BillnotPaidPage } from './billnot-paid.page';

const routes: Routes = [
  {
    path: '',
    component: BillnotPaidPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillnotPaidPageRoutingModule {}
