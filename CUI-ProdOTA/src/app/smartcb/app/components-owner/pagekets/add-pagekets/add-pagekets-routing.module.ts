import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddPageketsPage } from './add-pagekets.page';

const routes: Routes = [
  {
    path: '',
    component: AddPageketsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddPageketsPageRoutingModule {}
