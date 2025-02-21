import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MmoneyCashoutPageRoutingModule } from './mmoney-cashout-routing.module';

import { MmoneyCashoutPage } from './mmoney-cashout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MmoneyCashoutPageRoutingModule
  ],
  declarations: [MmoneyCashoutPage]
})
export class MmoneyCashoutPageModule {}
