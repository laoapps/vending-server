import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RemainingbillsPageRoutingModule } from './remainingbills-routing.module';

import { RemainingbillsPage } from './remainingbills.page';
import { QrCodeModule } from 'ng-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RemainingbillsPageRoutingModule,
    QrCodeModule
  ],
  declarations: [RemainingbillsPage]
})
export class RemainingbillsPageModule {}
