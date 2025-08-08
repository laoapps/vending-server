import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CloseStytemPageRoutingModule } from './close-stytem-routing.module';

import { CloseStytemPage } from './close-stytem.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CloseStytemPageRoutingModule
  ],
  declarations: [CloseStytemPage]
})
export class CloseStytemPageModule {}
