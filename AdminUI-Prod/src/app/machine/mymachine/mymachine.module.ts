import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MymachinePageRoutingModule } from './mymachine-routing.module';

import { MymachinePage } from './mymachine.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MymachinePageRoutingModule
  ],
  declarations: [MymachinePage]
})
export class MymachinePageModule {}
