import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhonenumberPageRoutingModule } from './phonenumber-routing.module';

import { PhonenumberPage } from './phonenumber.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PhonenumberPageRoutingModule
  ],
  declarations: [PhonenumberPage]
})
export class PhonenumberPageModule {}
