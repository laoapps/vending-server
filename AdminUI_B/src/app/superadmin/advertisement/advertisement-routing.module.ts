import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdvertisementPage } from './advertisement.page';

const routes: Routes = [
  {
    path: '',
    component: AdvertisementPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdvertisementPageRoutingModule {}
