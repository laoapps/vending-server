import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminProductShowcasePageRoutingModule } from './admin-product-showcase-routing.module';

import { AdminProductShowcasePage } from './admin-product-showcase.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminProductShowcasePageRoutingModule
  ],
  declarations: [AdminProductShowcasePage]
})
export class AdminProductShowcasePageModule {}
