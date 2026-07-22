import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MachineMapPage } from './machine-map.page';

const routes: Routes = [
  {
    path: '',
    component: MachineMapPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MachineMapPageRoutingModule {}
