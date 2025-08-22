import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetailHistoryPage } from './detail-history.page';

const routes: Routes = [
  {
    path: '',
    component: DetailHistoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetailHistoryPageRoutingModule {}
