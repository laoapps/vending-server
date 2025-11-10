import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SaleReportViewPageRoutingModule } from './sale-report-view-routing.module';

import { SaleReportViewPage } from './sale-report-view.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SaleReportViewPageRoutingModule
  ],
  declarations: [SaleReportViewPage]
})
export class SaleReportViewPageModule {}
