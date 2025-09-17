import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddPhonenumberPage } from './add-phonenumber.page';

const routes: Routes = [
  {
    path: '',
    component: AddPhonenumberPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddPhonenumberPageRoutingModule {}
