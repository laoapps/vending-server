import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ControlOrderPageRoutingModule } from './control-order-routing.module';

import { ControlOrderPage } from './control-order.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ControlOrderPageRoutingModule
  ],
  declarations: [ControlOrderPage]
})
export class ControlOrderPageModule {}
