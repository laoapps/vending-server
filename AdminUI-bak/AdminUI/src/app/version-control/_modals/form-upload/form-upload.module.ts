import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormUploadPageRoutingModule } from './form-upload-routing.module';

import { FormUploadPage } from './form-upload.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormUploadPageRoutingModule
  ],
  declarations: [FormUploadPage]
})
export class FormUploadPageModule {}
