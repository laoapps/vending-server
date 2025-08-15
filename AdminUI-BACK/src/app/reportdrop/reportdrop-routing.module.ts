import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportdropPage } from './reportdrop.page';

const routes: Routes = [
  {
    path: '',
    component: ReportdropPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportdropPageRoutingModule {}
