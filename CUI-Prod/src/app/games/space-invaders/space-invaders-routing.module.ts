import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SpaceInvadersPage } from './space-invaders.page';

const routes: Routes = [
  {
    path: '',
    component: SpaceInvadersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SpaceInvadersPageRoutingModule {}
