import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CloseStytemPage } from './close-stytem.page';

const routes: Routes = [
  {
    path: '',
    component: CloseStytemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CloseStytemPageRoutingModule {}
