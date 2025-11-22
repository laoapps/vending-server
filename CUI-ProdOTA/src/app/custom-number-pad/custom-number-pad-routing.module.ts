import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomNumberPadPage } from './custom-number-pad.page';

const routes: Routes = [
  {
    path: '',
    component: CustomNumberPadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomNumberPadPageRoutingModule {}
