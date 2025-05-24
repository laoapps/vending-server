import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportdropPageRoutingModule } from './reportdrop-routing.module';

import { ReportdropPage } from './reportdrop.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportdropPageRoutingModule
  ],
  declarations: [ReportdropPage]
})
export class ReportdropPageModule {}
