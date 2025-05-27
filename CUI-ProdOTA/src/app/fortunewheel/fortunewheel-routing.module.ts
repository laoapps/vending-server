import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FortunewheelPage } from './fortunewheel.page';

const routes: Routes = [
  {
    path: '',
    component: FortunewheelPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FortunewheelPageRoutingModule {}
