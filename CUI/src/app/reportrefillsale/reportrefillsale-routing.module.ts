import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportrefillsalePage } from './reportrefillsale.page';

const routes: Routes = [
  {
    path: '',
    component: ReportrefillsalePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportrefillsalePageRoutingModule {}
