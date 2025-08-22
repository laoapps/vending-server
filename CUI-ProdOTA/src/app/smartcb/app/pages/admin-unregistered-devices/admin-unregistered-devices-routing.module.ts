import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminUnregisteredDevicesPage } from './admin-unregistered-devices.page';

const routes: Routes = [
  {
    path: '',
    component: AdminUnregisteredDevicesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminUnregisteredDevicesPageRoutingModule {}
