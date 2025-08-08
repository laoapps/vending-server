import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DevicesPage } from './devices.page';

const routes: Routes = [
  {
    path: '',
    component: DevicesPage
  },
  {
    path: 'add-devices',
    loadChildren: () => import('./add-devices/add-devices.module').then( m => m.AddDevicesPageModule)
  },
  {
    path: 'control-device',
    loadChildren: () => import('./control-device/control-device.module').then( m => m.ControlDevicePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DevicesPageRoutingModule {}
