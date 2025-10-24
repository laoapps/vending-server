import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewReportSalePage } from './new-report-sale.page';

const routes: Routes = [
  {
    path: '',
    component: NewReportSalePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewReportSalePageRoutingModule {}
