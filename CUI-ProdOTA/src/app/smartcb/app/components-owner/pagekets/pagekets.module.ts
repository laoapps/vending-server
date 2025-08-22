import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PageketsPageRoutingModule } from './pagekets-routing.module';

import { PageketsPage } from './pagekets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PageketsPageRoutingModule
  ],
  declarations: [PageketsPage]
})
export class PageketsPageModule {}
