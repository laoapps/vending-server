import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HangmiFoodSegmentPage } from './hangmi-food-segment.page';

const routes: Routes = [
  {
    path: '',
    component: HangmiFoodSegmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HangmiFoodSegmentPageRoutingModule {}
