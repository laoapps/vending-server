import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GenQrCodePageRoutingModule } from './gen-qr-code-routing.module';

import { GenQrCodePage } from './gen-qr-code.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GenQrCodePageRoutingModule
  ],
  declarations: [GenQrCodePage]
})
export class GenQrCodePageModule {}
