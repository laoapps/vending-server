import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpinManagementPageRoutingModule } from './epin-management-routing.module';

import { EpinManagementPage } from './epin-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpinManagementPageRoutingModule
  ],
  declarations: [EpinManagementPage]
})
export class EpinManagementPageModule {}
