import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlayGamesPage } from './play-games.page';

const routes: Routes = [
  {
    path: '',
    component: PlayGamesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlayGamesPageRoutingModule {}
