import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpinShowCodePage } from './epin-show-code.page';

const routes: Routes = [
  {
    path: '',
    component: EpinShowCodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpinShowCodePageRoutingModule {}
