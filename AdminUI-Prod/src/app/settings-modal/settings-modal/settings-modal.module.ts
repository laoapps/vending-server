import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettingsModalPageRoutingModule } from './settings-modal-routing.module';

import { SettingsModalPage } from './settings-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettingsModalPageRoutingModule
  ],
  declarations: [SettingsModalPage]
})
export class SettingsModalPageModule {}
