import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageSubadminInfoPage } from './manage-subadmin-info.page';

const routes: Routes = [
  {
    path: '',
    component: ManageSubadminInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageSubadminInfoPageRoutingModule {}
