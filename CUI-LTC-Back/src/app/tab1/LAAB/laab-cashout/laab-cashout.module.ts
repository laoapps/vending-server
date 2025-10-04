import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaabCashoutPageRoutingModule } from './laab-cashout-routing.module';

import { LaabCashoutPage } from './laab-cashout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaabCashoutPageRoutingModule
  ],
  declarations: [LaabCashoutPage]
})
export class LaabCashoutPageModule {}
