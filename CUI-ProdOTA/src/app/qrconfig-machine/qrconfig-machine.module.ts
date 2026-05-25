import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QrconfigMachinePageRoutingModule } from './qrconfig-machine-routing.module';

import { QrconfigMachinePage } from './qrconfig-machine.page';
import { QrCodeModule } from 'ng-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrconfigMachinePageRoutingModule,
    QrCodeModule
  ],
  declarations: [QrconfigMachinePage]
})
export class QrconfigMachinePageModule {}
