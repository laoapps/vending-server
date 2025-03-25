import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaabCashinShowCodePage } from './laab-cashin-show-code.page';

const routes: Routes = [
  {
    path: '',
    component: LaabCashinShowCodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaabCashinShowCodePageRoutingModule {}
