import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrintReceiptPage } from './print-receipt.page';

const routes: Routes = [
  {
    path: '',
    component: PrintReceiptPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrintReceiptPageRoutingModule {}
