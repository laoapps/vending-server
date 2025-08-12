import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfirmcodePageRoutingModule } from './confirmcode-routing.module';

import { ConfirmcodePage } from './confirmcode.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfirmcodePageRoutingModule
  ],
  declarations: [ConfirmcodePage]
})
export class ConfirmcodePageModule {}
