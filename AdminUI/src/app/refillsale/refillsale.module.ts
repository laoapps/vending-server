import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RefillsalePageRoutingModule } from './refillsale-routing.module';

import { RefillsalePage } from './refillsale.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RefillsalePageRoutingModule
  ],
  declarations: [RefillsalePage]
})
export class RefillsalePageModule {}
