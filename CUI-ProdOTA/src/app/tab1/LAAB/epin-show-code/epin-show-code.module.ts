import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpinShowCodePageRoutingModule } from './epin-show-code-routing.module';

import { EpinShowCodePage } from './epin-show-code.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpinShowCodePageRoutingModule
  ],
  declarations: [EpinShowCodePage]
})
export class EpinShowCodePageModule {}
