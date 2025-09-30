import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TopupServicePage } from './topup-service.page';

const routes: Routes = [
  {
    path: '',
    component: TopupServicePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TopupServicePageRoutingModule {}
