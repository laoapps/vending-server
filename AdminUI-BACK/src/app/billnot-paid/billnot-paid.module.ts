import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BillnotPaidPageRoutingModule } from './billnot-paid-routing.module';

import { BillnotPaidPage } from './billnot-paid.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BillnotPaidPageRoutingModule
  ],
  declarations: [BillnotPaidPage]
})
export class BillnotPaidPageModule {}
