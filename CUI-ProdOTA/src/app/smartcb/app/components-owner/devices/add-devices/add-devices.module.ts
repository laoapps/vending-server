import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddDevicesPageRoutingModule } from './add-devices-routing.module';

import { AddDevicesPage } from './add-devices.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddDevicesPageRoutingModule
  ],
  declarations: [AddDevicesPage]
})
export class AddDevicesPageModule {}
