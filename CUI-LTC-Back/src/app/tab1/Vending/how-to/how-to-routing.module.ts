import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HowToPage } from './how-to.page';

const routes: Routes = [
  {
    path: '',
    component: HowToPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HowToPageRoutingModule {}
