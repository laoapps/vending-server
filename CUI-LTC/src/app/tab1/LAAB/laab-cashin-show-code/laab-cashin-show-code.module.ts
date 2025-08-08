import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaabCashinShowCodePageRoutingModule } from './laab-cashin-show-code-routing.module';

import { LaabCashinShowCodePage } from './laab-cashin-show-code.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaabCashinShowCodePageRoutingModule
  ],
  declarations: [LaabCashinShowCodePage]
})
export class LaabCashinShowCodePageModule {}
