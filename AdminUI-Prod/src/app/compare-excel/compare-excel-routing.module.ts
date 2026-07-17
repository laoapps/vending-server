import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompareExcelPage } from './compare-excel.page';

const routes: Routes = [
  {
    path: '',
    component: CompareExcelPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompareExcelPageRoutingModule {}
