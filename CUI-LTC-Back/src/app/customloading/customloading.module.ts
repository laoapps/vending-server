import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CustomloadingPageRoutingModule } from './customloading-routing.module';

import { CustomloadingPage } from './customloading.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CustomloadingPageRoutingModule
  ],
  declarations: [CustomloadingPage]
})
export class CustomloadingPageModule {}
