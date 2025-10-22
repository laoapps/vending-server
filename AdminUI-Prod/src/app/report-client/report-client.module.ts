import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReportClientPageRoutingModule } from './report-client-routing.module';

import { ReportClientPage } from './report-client.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportClientPageRoutingModule
  ],
  declarations: [ReportClientPage]
})
export class ReportClientPageModule {}
