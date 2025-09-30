import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaabGoPage } from './laab-go.page';

const routes: Routes = [
  {
    path: '',
    component: LaabGoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaabGoPageRoutingModule {}
