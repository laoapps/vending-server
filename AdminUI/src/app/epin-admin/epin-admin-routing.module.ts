import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpinAdminPage } from './epin-admin.page';

const routes: Routes = [
  {
    path: '',
    component: EpinAdminPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpinAdminPageRoutingModule {}
