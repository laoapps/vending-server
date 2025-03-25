import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TodaybillPageRoutingModule } from './todaybill-routing.module';

import { TodaybillPage } from './todaybill.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TodaybillPageRoutingModule
  ],
  declarations: [TodaybillPage]
})
export class TodaybillPageModule {}
