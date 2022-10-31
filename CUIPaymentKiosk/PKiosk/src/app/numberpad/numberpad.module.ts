import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NumberpadPageRoutingModule } from './numberpad-routing.module';

import { NumberpadPage } from './numberpad.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NumberpadPageRoutingModule
  ],
  declarations: [NumberpadPage]
})
export class NumberpadPageModule {}
