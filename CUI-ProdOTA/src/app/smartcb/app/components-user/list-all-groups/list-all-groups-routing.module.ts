import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListAllGroupsPage } from './list-all-groups.page';

const routes: Routes = [
  {
    path: '',
    component: ListAllGroupsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListAllGroupsPageRoutingModule {}
