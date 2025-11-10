import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpinShowcodePageRoutingModule } from './epin-showcode-routing.module';

import { EpinShowcodePage } from './epin-showcode.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpinShowcodePageRoutingModule
  ],
  declarations: [EpinShowcodePage]
})
export class EpinShowcodePageModule {}
