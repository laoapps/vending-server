import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PayQrPageRoutingModule } from './pay-qr-routing.module';

import { PayQrPage } from './pay-qr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PayQrPageRoutingModule
  ],
  declarations: [PayQrPage]
})
export class PayQrPageModule {}
