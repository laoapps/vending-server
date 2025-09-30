import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListDevicesQrPage } from './list-devices-qr.page';

const routes: Routes = [
  {
    path: '',
    component: ListDevicesQrPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListDevicesQrPageRoutingModule {}
