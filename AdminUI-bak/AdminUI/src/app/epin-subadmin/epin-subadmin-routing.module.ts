import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpinSubadminPage } from './epin-subadmin.page';

const routes: Routes = [
  {
    path: '',
    component: EpinSubadminPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpinSubadminPageRoutingModule {}
