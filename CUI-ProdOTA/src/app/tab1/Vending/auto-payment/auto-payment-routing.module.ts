import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AutoPaymentPage } from './auto-payment.page';
import { AutoPaymentPageModule } from './auto-payment.module';

const routes: Routes = [
  {
    path: '',
    component: AutoPaymentPage
  }
];

@NgModule({
  imports: [
    AutoPaymentPageModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
})
export class AutoPaymentPageRoutingModule {}
