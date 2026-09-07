import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminProductShowcasePage } from './admin-product-showcase.page';

const routes: Routes = [
  {
    path: '',
    component: AdminProductShowcasePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminProductShowcasePageRoutingModule {}
