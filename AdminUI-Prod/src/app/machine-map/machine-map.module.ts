import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MachineMapPageRoutingModule } from './machine-map-routing.module';
import { MachineMapPage } from './machine-map.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MachineMapPageRoutingModule
  ],
  declarations: [MachineMapPage]
})
export class MachineMapPageModule {}
