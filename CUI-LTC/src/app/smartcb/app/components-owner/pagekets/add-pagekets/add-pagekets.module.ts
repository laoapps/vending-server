import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddPageketsPageRoutingModule } from './add-pagekets-routing.module';

import { AddPageketsPage } from './add-pagekets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddPageketsPageRoutingModule
  ],
  declarations: [AddPageketsPage]
})
export class AddPageketsPageModule {}
