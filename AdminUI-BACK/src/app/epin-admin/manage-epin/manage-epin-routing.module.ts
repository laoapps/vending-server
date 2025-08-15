import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageEpinPage } from './manage-epin.page';

const routes: Routes = [
  {
    path: '',
    component: ManageEpinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageEpinPageRoutingModule {}
