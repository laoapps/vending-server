import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShowQrhashVerifyPage } from './show-qrhash-verify.page';

const routes: Routes = [
  {
    path: '',
    component: ShowQrhashVerifyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowQrhashVerifyPageRoutingModule {}
