import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LogTempPageRoutingModule } from './log-temp-routing.module';

import { LogTempPage } from './log-temp.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LogTempPageRoutingModule
  ],
  declarations: [LogTempPage]
})
export class LogTempPageModule {}
