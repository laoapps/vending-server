import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddDevicesPage } from './add-devices.page';

const routes: Routes = [
  {
    path: '',
    component: AddDevicesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddDevicesPageRoutingModule {}
