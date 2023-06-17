import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RemainingbilllocalPageRoutingModule } from './remainingbilllocal-routing.module';

import { RemainingbilllocalPage } from './remainingbilllocal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RemainingbilllocalPageRoutingModule
  ],
  declarations: [RemainingbilllocalPage]
})
export class RemainingbilllocalPageModule {}
