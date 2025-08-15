import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VersionControlPage } from './version-control.page';

const routes: Routes = [
  {
    path: '',
    component: VersionControlPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VersionControlPageRoutingModule {}
