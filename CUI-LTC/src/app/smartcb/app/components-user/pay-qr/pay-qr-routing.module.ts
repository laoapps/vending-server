import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PayQrPage } from './pay-qr.page';

const routes: Routes = [
  {
    path: '',
    component: PayQrPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PayQrPageRoutingModule {}
