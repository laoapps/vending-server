import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PositionlistPage } from './positionlist.page';

const routes: Routes = [
  {
    path: '',
    component: PositionlistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PositionlistPageRoutingModule {}
