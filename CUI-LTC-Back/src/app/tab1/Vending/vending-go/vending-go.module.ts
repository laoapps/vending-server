import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VendingGoPageRoutingModule } from './vending-go-routing.module';

import { VendingGoPage } from './vending-go.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VendingGoPageRoutingModule
  ],
  declarations: [VendingGoPage]
})
export class VendingGoPageModule {}
