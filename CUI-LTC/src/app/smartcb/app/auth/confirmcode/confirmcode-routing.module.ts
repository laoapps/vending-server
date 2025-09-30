import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmcodePage } from './confirmcode.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmcodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmcodePageRoutingModule {}
