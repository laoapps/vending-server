import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CoinTransferBillPage } from './coin-transfer-bill.page';

const routes: Routes = [
  {
    path: '',
    component: CoinTransferBillPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoinTransferBillPageRoutingModule {}
