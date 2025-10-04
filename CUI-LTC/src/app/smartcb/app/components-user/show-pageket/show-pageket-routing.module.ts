import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShowPageketPage } from './show-pageket.page';

const routes: Routes = [
  {
    path: '',
    component: ShowPageketPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowPageketPageRoutingModule {}
