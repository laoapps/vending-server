import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportbillsPageRoutingModule } from './reportbills-routing.module';

import { ReportbillsPage } from './reportbills.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportbillsPageRoutingModule
  ],
  declarations: [ReportbillsPage]
})
export class ReportbillsPageModule {}
