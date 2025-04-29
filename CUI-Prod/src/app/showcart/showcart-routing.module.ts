import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShowcartPage } from './showcart.page';

const routes: Routes = [
  {
    path: '',
    component: ShowcartPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowcartPageRoutingModule {}
