import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RemainingbillsPageRoutingModule } from './remainingbills-routing.module';

import { RemainingbillsPage } from './remainingbills.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RemainingbillsPageRoutingModule
  ],
  declarations: [RemainingbillsPage]
})
export class RemainingbillsPageModule {}
