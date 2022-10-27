import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PhonenumberPage } from './phonenumber.page';

const routes: Routes = [
  {
    path: '',
    component: PhonenumberPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PhonenumberPageRoutingModule {}
