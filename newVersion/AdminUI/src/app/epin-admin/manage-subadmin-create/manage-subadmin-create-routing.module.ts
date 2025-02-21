import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageSubadminCreatePage } from './manage-subadmin-create.page';

const routes: Routes = [
  {
    path: '',
    component: ManageSubadminCreatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageSubadminCreatePageRoutingModule {}
