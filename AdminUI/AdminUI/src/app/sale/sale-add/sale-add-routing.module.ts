import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SaleAddPage } from './sale-add.page';

const routes: Routes = [
  {
    path: '',
    component: SaleAddPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaleAddPageRoutingModule {}
