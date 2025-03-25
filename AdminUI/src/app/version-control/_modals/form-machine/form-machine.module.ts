import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormMachinePageRoutingModule } from './form-machine-routing.module';

import { FormMachinePage } from './form-machine.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormMachinePageRoutingModule
  ],
  declarations: [FormMachinePage]
})
export class FormMachinePageModule {}
