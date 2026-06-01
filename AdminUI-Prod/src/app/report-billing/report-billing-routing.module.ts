import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportBillingPage } from './report-billing.page';

const routes: Routes = [
  {
    path: '',
    component: ReportBillingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportBillingPageRoutingModule {}
