import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RemainingbilllocalPage } from './remainingbilllocal.page';

const routes: Routes = [
  {
    path: '',
    component: RemainingbilllocalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RemainingbilllocalPageRoutingModule {}
