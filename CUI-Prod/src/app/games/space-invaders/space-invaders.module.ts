import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SpaceInvadersPageRoutingModule } from './space-invaders-routing.module';

import { SpaceInvadersPage } from './space-invaders.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SpaceInvadersPageRoutingModule
  ],
  declarations: [SpaceInvadersPage]
})
export class SpaceInvadersPageModule {}
