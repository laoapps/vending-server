import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ControlDevicePageRoutingModule } from './control-device-routing.module';

import { ControlDevicePage } from './control-device.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ControlDevicePageRoutingModule
  ],
  declarations: [ControlDevicePage]
})
export class ControlDevicePageModule {}
