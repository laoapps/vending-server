import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ImagesproductPageRoutingModule } from './imagesproduct-routing.module';

import { ImagesproductPage } from './imagesproduct.page';
import { MachinePickerComponent } from '../sale/machine-picker/machine-picker.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImagesproductPageRoutingModule,
    MachinePickerComponent
  ],
  declarations: [ImagesproductPage]
})
export class ImagesproductPageModule {}
