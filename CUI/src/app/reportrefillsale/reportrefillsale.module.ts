import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportrefillsalePageRoutingModule } from './reportrefillsale-routing.module';

import { ReportrefillsalePage } from './reportrefillsale.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportrefillsalePageRoutingModule
  ],
  declarations: [ReportrefillsalePage]
})
export class ReportrefillsalePageModule {}
