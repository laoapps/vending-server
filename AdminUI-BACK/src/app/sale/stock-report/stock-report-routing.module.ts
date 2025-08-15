import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StockReportPage } from './stock-report.page';

const routes: Routes = [
  {
    path: '',
    component: StockReportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StockReportPageRoutingModule {}
