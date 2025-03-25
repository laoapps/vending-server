import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MachineAddPageRoutingModule } from './machine-add-routing.module';

import { MachineAddPage } from './machine-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MachineAddPageRoutingModule
  ],
  declarations: [MachineAddPage]
})
export class MachineAddPageModule {}
