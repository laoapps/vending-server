import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScratchingPage } from './scratching.page';

const routes: Routes = [
  {
    path: '',
    component: ScratchingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScratchingPageRoutingModule {}
