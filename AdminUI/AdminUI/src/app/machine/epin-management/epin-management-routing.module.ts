import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpinManagementPage } from './epin-management.page';

const routes: Routes = [
  {
    path: '',
    component: EpinManagementPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpinManagementPageRoutingModule {}
