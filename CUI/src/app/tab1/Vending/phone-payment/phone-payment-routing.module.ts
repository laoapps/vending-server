import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PhonePaymentPage } from './phone-payment.page';

const routes: Routes = [
  {
    path: '',
    component: PhonePaymentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PhonePaymentPageRoutingModule {}
