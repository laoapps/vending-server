import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ControlDevicePage } from './control-device.page';

const routes: Routes = [
  {
    path: '',
    component: ControlDevicePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ControlDevicePageRoutingModule {}
