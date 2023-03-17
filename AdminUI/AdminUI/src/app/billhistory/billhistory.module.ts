import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BillhistoryPageRoutingModule } from './billhistory-routing.module';

import { BillhistoryPage } from './billhistory.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BillhistoryPageRoutingModule
  ],
  declarations: [BillhistoryPage]
})
export class BillhistoryPageModule {}
