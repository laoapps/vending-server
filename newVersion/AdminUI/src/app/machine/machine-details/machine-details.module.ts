import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MachineDetailsPageRoutingModule } from './machine-details-routing.module';

import { MachineDetailsPage } from './machine-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MachineDetailsPageRoutingModule
  ],
  declarations: [MachineDetailsPage]
})
export class MachineDetailsPageModule {}
