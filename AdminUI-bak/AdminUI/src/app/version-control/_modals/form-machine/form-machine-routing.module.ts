import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormMachinePage } from './form-machine.page';

const routes: Routes = [
  {
    path: '',
    component: FormMachinePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormMachinePageRoutingModule {}
