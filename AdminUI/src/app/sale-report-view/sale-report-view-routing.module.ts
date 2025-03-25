import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SaleReportViewPage } from './sale-report-view.page';

const routes: Routes = [
  {
    path: '',
    component: SaleReportViewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaleReportViewPageRoutingModule {}
