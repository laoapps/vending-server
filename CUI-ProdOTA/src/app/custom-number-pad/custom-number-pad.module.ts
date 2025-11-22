import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CustomNumberPadPageRoutingModule } from './custom-number-pad-routing.module';

import { CustomNumberPadPage } from './custom-number-pad.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomNumberPadPageRoutingModule
  ],
  declarations: [CustomNumberPadPage]
})
export class CustomNumberPadPageModule {}
