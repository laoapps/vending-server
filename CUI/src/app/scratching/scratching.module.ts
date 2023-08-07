import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScratchingPageRoutingModule } from './scratching-routing.module';

import { ScratchingPage } from './scratching.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScratchingPageRoutingModule
  ],
  declarations: [ScratchingPage]
})
export class ScratchingPageModule {}
