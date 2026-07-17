import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CompareExcelPageRoutingModule } from './compare-excel-routing.module';

import { CompareExcelPage } from './compare-excel.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CompareExcelPageRoutingModule
  ],
  declarations: [CompareExcelPage]
})
export class CompareExcelPageModule {}
