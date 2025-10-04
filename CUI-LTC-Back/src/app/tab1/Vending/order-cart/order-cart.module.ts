import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrderCartPageRoutingModule } from './order-cart-routing.module';

import { OrderCartPage } from './order-cart.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderCartPageRoutingModule
  ],
  declarations: [OrderCartPage]
})
export class OrderCartPageModule {}
