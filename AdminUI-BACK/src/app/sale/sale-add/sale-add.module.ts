import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SaleAddPageRoutingModule } from './sale-add-routing.module';

import { SaleAddPage } from './sale-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SaleAddPageRoutingModule
  ],
  declarations: [SaleAddPage]
})
export class SaleAddPageModule {}
