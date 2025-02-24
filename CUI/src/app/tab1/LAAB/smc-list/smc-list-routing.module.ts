import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SmcListPage } from './smc-list.page';

const routes: Routes = [
  {
    path: '',
    component: SmcListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SmcListPageRoutingModule {}
