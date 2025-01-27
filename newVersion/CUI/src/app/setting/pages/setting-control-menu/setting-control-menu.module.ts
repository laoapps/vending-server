import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettingControlMenuPageRoutingModule } from './setting-control-menu-routing.module';

import { SettingControlMenuPage } from './setting-control-menu.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettingControlMenuPageRoutingModule
  ],
  declarations: [SettingControlMenuPage]
})
export class SettingControlMenuPageModule {}
