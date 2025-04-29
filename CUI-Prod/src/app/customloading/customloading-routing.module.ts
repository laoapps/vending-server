import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomloadingPage } from './customloading.page';

const routes: Routes = [
  {
    path: '',
    component: CustomloadingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomloadingPageRoutingModule {}
