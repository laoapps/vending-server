import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FindMyEpinPage } from './find-my-epin.page';

const routes: Routes = [
  {
    path: '',
    component: FindMyEpinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FindMyEpinPageRoutingModule {}
