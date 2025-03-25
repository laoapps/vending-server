import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HangmiFoodSegmentPageRoutingModule } from './hangmi-food-segment-routing.module';

import { HangmiFoodSegmentPage } from './hangmi-food-segment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HangmiFoodSegmentPageRoutingModule
  ],
  declarations: [HangmiFoodSegmentPage]
})
export class HangmiFoodSegmentPageModule {}
