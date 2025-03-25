import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HashVerifyPage } from './hash-verify.page';

const routes: Routes = [
  {
    path: '',
    component: HashVerifyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HashVerifyPageRoutingModule {}
