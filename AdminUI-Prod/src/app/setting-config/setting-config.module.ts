import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettingConfigPageRoutingModule } from './setting-config-routing.module';

import { SettingConfigPage } from './setting-config.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettingConfigPageRoutingModule
  ],
  declarations: [SettingConfigPage]
})
export class SettingConfigPageModule {}
