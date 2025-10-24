import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewReportSalePageRoutingModule } from './new-report-sale-routing.module';

import { NewReportSalePage } from './new-report-sale.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewReportSalePageRoutingModule
  ],
  declarations: [NewReportSalePage]
})
export class NewReportSalePageModule {}
