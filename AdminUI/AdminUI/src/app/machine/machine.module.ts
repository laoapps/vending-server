import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MachinePageRoutingModule } from './machine-routing.module';

import { MachinePage } from './machine.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MachinePageRoutingModule
  ],
  declarations: [MachinePage]
})
export class MachinePageModule {}
