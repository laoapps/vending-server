import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportCallbacklogPageRoutingModule } from './report-callbacklog-routing.module';

import { ReportCallbacklogPage } from './report-callbacklog.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportCallbacklogPageRoutingModule
  ],
  declarations: [ReportCallbacklogPage]
})
export class ReportCallbacklogPageModule {}
