import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportbillsPage } from './reportbills.page';

const routes: Routes = [
  {
    path: '',
    component: ReportbillsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportbillsPageRoutingModule {}
