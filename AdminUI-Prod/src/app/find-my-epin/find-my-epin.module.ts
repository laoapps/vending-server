import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FindMyEpinPageRoutingModule } from './find-my-epin-routing.module';

import { FindMyEpinPage } from './find-my-epin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FindMyEpinPageRoutingModule
  ],
  declarations: [FindMyEpinPage]
})
export class FindMyEpinPageModule {}
