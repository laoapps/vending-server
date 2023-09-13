import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReadmePageRoutingModule } from './readme-routing.module';

import { ReadmePage } from './readme.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReadmePageRoutingModule
  ],
  declarations: [ReadmePage]
})
export class ReadmePageModule {}
