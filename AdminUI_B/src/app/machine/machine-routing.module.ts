import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MachinePage } from './machine.page';

const routes: Routes = [
  {
    path: '',
    component: MachinePage
  },
  {
    path: 'mymachine',
    loadChildren: () => import('./mymachine/mymachine.module').then( m => m.MymachinePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MachinePageRoutingModule {}
