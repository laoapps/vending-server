import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpinShowcodePage } from './epin-showcode.page';

const routes: Routes = [
  {
    path: '',
    component: EpinShowcodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpinShowcodePageRoutingModule {}
