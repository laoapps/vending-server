import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CartQrPage } from './cart-qr.page';

const routes: Routes = [
  {
    path: '',
    component: CartQrPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CartQrPageRoutingModule {}
