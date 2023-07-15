import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageEpinPageRoutingModule } from './manage-epin-routing.module';

import { ManageEpinPage } from './manage-epin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageEpinPageRoutingModule
  ],
  declarations: [ManageEpinPage]
})
export class ManageEpinPageModule {}
