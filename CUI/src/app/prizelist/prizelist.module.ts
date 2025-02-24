import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrizelistPageRoutingModule } from './prizelist-routing.module';

import { PrizelistPage } from './prizelist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrizelistPageRoutingModule
  ],
  declarations: [PrizelistPage]
})
export class PrizelistPageModule {}
