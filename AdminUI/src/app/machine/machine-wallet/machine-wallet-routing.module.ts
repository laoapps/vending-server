import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MachineWalletPage } from './machine-wallet.page';

const routes: Routes = [
  {
    path: '',
    component: MachineWalletPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MachineWalletPageRoutingModule {}
