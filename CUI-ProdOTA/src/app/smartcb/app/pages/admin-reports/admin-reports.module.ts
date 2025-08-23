import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminReportsPageRoutingModule } from './admin-reports-routing.module';

import { AdminReportsPage } from './admin-reports.page';
import { JsonPipe } from '@angular/common';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminReportsPageRoutingModule,
    JsonPipe
  ],
  declarations: [AdminReportsPage]
})
export class AdminReportsPageModule {}
