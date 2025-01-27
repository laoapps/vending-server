import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AutoPaymentPage } from './auto-payment.page';

const routes: Routes = [
  {
    path: '',
    component: AutoPaymentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AutoPaymentPageRoutingModule {}
