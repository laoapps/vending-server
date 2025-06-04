import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OwnerDashboardPage } from './owner-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: OwnerDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnerDashboardPageRoutingModule {}
