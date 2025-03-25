import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HangmiStoreSegmentPage } from './hangmi-store-segment.page';

const routes: Routes = [
  {
    path: '',
    component: HangmiStoreSegmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HangmiStoreSegmentPageRoutingModule {}
