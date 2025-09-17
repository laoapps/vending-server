import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GivePopUpPage } from './give-pop-up.page';

const routes: Routes = [
  {
    path: '',
    component: GivePopUpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GivePopUpPageRoutingModule {}
