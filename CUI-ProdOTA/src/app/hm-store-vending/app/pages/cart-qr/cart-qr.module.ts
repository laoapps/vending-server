import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CartQrPageRoutingModule } from './cart-qr-routing.module';

import { CartQrPage } from './cart-qr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CartQrPageRoutingModule
  ],
  declarations: [CartQrPage]
})
export class CartQrPageModule {}
