import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GenQrCodePage } from './gen-qr-code.page';

const routes: Routes = [
  {
    path: '',
    component: GenQrCodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GenQrCodePageRoutingModule {}
