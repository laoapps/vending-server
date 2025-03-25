import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BillhistoryPage } from './billhistory.page';

const routes: Routes = [
  {
    path: '',
    component: BillhistoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillhistoryPageRoutingModule {}
