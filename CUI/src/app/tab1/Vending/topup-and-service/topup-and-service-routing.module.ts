import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TopupAndServicePage } from './topup-and-service.page';

const routes: Routes = [
  {
    path: '',
    component: TopupAndServicePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TopupAndServicePageRoutingModule {}
