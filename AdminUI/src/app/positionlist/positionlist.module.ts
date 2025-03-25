import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PositionlistPageRoutingModule } from './positionlist-routing.module';

import { PositionlistPage } from './positionlist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PositionlistPageRoutingModule
  ],
  declarations: [PositionlistPage]
})
export class PositionlistPageModule {}
