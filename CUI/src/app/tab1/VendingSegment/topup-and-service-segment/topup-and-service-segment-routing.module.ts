import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TopupAndServiceSegmentPage } from './topup-and-service-segment.page';

const routes: Routes = [
  {
    path: '',
    component: TopupAndServiceSegmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TopupAndServiceSegmentPageRoutingModule {}
