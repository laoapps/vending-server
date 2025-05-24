import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StockReportPageRoutingModule } from './stock-report-routing.module';

import { StockReportPage } from './stock-report.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StockReportPageRoutingModule
  ],
  declarations: [StockReportPage]
})
export class StockReportPageModule {}
