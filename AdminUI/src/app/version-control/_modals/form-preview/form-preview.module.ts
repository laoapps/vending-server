import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormPreviewPageRoutingModule } from './form-preview-routing.module';

import { FormPreviewPage } from './form-preview.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormPreviewPageRoutingModule
  ],
  declarations: [FormPreviewPage]
})
export class FormPreviewPageModule {}
