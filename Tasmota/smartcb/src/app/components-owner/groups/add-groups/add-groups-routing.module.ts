import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddGroupsPage } from './add-groups.page';

const routes: Routes = [
  {
    path: '',
    component: AddGroupsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddGroupsPageRoutingModule {}
