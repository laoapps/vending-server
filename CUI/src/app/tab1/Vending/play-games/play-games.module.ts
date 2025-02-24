import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PlayGamesPageRoutingModule } from './play-games-routing.module';

import { PlayGamesPage } from './play-games.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlayGamesPageRoutingModule
  ],
  declarations: [PlayGamesPage]
})
export class PlayGamesPageModule {}
