import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SaleReportPageRoutingModule } from './sale-report-routing.module';

import { SaleReportPage } from './sale-report.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SaleReportPageRoutingModule
  ],
  declarations: [SaleReportPage]
})
export class SaleReportPageModule {}
