import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShowDevicesPageRoutingModule } from './show-devices-routing.module';

import { ShowDevicesPage } from './show-devices.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShowDevicesPageRoutingModule
  ],
  declarations: [ShowDevicesPage]
})
export class ShowDevicesPageModule {}
