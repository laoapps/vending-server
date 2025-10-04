import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrderPaidPageRoutingModule } from './order-paid-routing.module';

import { OrderPaidPage } from './order-paid.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderPaidPageRoutingModule
  ],
  declarations: [OrderPaidPage]
})
export class OrderPaidPageModule {}
