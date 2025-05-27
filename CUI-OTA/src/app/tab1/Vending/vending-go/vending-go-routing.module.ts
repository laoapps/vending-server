import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VendingGoPage } from './vending-go.page';

const routes: Routes = [
  {
    path: '',
    component: VendingGoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendingGoPageRoutingModule {}
