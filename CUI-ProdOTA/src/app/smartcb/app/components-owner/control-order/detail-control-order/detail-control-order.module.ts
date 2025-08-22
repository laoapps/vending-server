import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetailControlOrderPageRoutingModule } from './detail-control-order-routing.module';

import { DetailControlOrderPage } from './detail-control-order.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetailControlOrderPageRoutingModule
  ],
  declarations: [DetailControlOrderPage]
})
export class DetailControlOrderPageModule {}
