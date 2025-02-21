import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaabGoPageRoutingModule } from './laab-go-routing.module';

import { LaabGoPage } from './laab-go.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaabGoPageRoutingModule
  ],
  declarations: [LaabGoPage]
})
export class LaabGoPageModule {}
