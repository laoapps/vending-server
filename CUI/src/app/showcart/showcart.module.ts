import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShowcartPageRoutingModule } from './showcart-routing.module';

import { ShowcartPage } from './showcart.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShowcartPageRoutingModule
  ],
  declarations: [ShowcartPage]
})
export class ShowcartPageModule {}
