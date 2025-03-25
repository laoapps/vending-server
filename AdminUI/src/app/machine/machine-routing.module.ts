import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MachinePage } from './machine.page';

const routes: Routes = [
  {
    path: '',
    component: MachinePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MachinePageRoutingModule {}
