import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminUnregisteredDevicesPageRoutingModule } from './admin-unregistered-devices-routing.module';

import { AdminUnregisteredDevicesPage } from './admin-unregistered-devices.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminUnregisteredDevicesPageRoutingModule
  ],
  declarations: [AdminUnregisteredDevicesPage]
})
export class AdminUnregisteredDevicesPageModule {}
