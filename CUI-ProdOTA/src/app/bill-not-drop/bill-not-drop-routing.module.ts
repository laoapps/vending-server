import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BillNotDropPage } from './bill-not-drop.page';

const routes: Routes = [
  {
    path: '',
    component: BillNotDropPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillNotDropPageRoutingModule {}
