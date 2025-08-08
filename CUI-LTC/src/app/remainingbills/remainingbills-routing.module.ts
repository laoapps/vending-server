import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RemainingbillsPage } from './remainingbills.page';

const routes: Routes = [
  {
    path: '',
    component: RemainingbillsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RemainingbillsPageRoutingModule {}
