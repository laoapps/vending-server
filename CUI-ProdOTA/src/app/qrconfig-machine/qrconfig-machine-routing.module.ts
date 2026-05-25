import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QrconfigMachinePage } from './qrconfig-machine.page';

const routes: Routes = [
  {
    path: '',
    component: QrconfigMachinePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QrconfigMachinePageRoutingModule {}
