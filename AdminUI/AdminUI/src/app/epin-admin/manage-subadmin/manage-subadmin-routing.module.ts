import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageSubadminPage } from './manage-subadmin.page';

const routes: Routes = [
  {
    path: '',
    component: ManageSubadminPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageSubadminPageRoutingModule {}
