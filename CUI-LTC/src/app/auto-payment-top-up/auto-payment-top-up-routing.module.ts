import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AutoPaymentTopUpPage } from './auto-payment-top-up.page';

const routes: Routes = [
  {
    path: '',
    component: AutoPaymentTopUpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AutoPaymentTopUpPageRoutingModule {}
