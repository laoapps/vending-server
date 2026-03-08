import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PublicAdminManagePage } from './public-admin-manage.page';

const routes: Routes = [
  {
    path: '',
    component: PublicAdminManagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicAdminManagePageRoutingModule {}
