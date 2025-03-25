import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TodaybillPage } from './todaybill.page';

const routes: Routes = [
  {
    path: '',
    component: TodaybillPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TodaybillPageRoutingModule {}
