import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrizelistPage } from './prizelist.page';

const routes: Routes = [
  {
    path: '',
    component: PrizelistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrizelistPageRoutingModule {}
