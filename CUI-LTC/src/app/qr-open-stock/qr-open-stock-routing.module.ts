import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QrOpenStockPage } from './qr-open-stock.page';

const routes: Routes = [
  {
    path: '',
    component: QrOpenStockPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QrOpenStockPageRoutingModule {}
