import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TopupAndServiceSegmentPageRoutingModule } from './topup-and-service-segment-routing.module';

import { TopupAndServiceSegmentPage } from './topup-and-service-segment.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TopupAndServiceSegmentPageRoutingModule
  ],
  declarations: [TopupAndServiceSegmentPage]
})
export class TopupAndServiceSegmentPageModule {}
