import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HangmiStoreSegmentPageRoutingModule } from './hangmi-store-segment-routing.module';

import { HangmiStoreSegmentPage } from './hangmi-store-segment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HangmiStoreSegmentPageRoutingModule
  ],
  declarations: [HangmiStoreSegmentPage]
})
export class HangmiStoreSegmentPageModule {}
