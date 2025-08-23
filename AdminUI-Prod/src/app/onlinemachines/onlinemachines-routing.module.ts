import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OnlinemachinesPage } from './onlinemachines.page';

const routes: Routes = [
  {
    path: '',
    component: OnlinemachinesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OnlinemachinesPageRoutingModule {}
