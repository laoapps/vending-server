import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListDevicesQrPageRoutingModule } from './list-devices-qr-routing.module';

import { ListDevicesQrPage } from './list-devices-qr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListDevicesQrPageRoutingModule
  ],
  declarations: [ListDevicesQrPage]
})
export class ListDevicesQrPageModule {}
