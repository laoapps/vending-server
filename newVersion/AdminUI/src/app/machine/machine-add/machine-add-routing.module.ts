import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MachineAddPage } from './machine-add.page';

const routes: Routes = [
  {
    path: '',
    component: MachineAddPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MachineAddPageRoutingModule {}
