import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StackCashoutPageRoutingModule } from './stack-cashout-routing.module';

import { StackCashoutPage } from './stack-cashout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StackCashoutPageRoutingModule
  ],
  declarations: [StackCashoutPage]
})
export class StackCashoutPageModule {}
