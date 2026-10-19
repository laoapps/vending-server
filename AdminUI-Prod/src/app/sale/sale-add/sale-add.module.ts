import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { MachinePickerComponent } from '../machine-picker/machine-picker.component';

import { SaleAddPageRoutingModule } from './sale-add-routing.module';

import { SaleAddPage } from './sale-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MachinePickerComponent,
    SaleAddPageRoutingModule
  ],
  declarations: [SaleAddPage]
})
export class SaleAddPageModule {}
