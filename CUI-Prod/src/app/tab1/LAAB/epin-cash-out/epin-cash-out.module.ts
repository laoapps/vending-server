import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpinCashOutPageRoutingModule } from './epin-cash-out-routing.module';

import { EpinCashOutPage } from './epin-cash-out.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpinCashOutPageRoutingModule
  ],
  declarations: [EpinCashOutPage]
})
export class EpinCashOutPageModule {}
