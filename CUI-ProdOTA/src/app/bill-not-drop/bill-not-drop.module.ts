import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BillNotDropPageRoutingModule } from './bill-not-drop-routing.module';

import { BillNotDropPage } from './bill-not-drop.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BillNotDropPageRoutingModule
  ],
  declarations: [BillNotDropPage]
})
export class BillNotDropPageModule {}
