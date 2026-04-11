import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportCallbacklogPage } from './report-callbacklog.page';

const routes: Routes = [
  {
    path: '',
    component: ReportCallbacklogPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportCallbacklogPageRoutingModule {}
