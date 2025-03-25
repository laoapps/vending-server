import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdvertisementPageRoutingModule } from './advertisement-routing.module';

import { AdvertisementPage } from './advertisement.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdvertisementPageRoutingModule
  ],
  declarations: [AdvertisementPage]
})
export class AdvertisementPageModule {}
