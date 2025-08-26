import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShowPackageQrPage } from './show-package-qr.page';

const routes: Routes = [
  {
    path: '',
    component: ShowPackageQrPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowPackageQrPageRoutingModule {}
