import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportBillingPageRoutingModule } from './report-billing-routing.module';

import { ReportBillingPage } from './report-billing.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportBillingPageRoutingModule
  ],
  declarations: [ReportBillingPage]
})
export class ReportBillingPageModule {}
