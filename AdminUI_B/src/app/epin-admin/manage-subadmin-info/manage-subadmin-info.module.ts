import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageSubadminInfoPageRoutingModule } from './manage-subadmin-info-routing.module';

import { ManageSubadminInfoPage } from './manage-subadmin-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageSubadminInfoPageRoutingModule
  ],
  declarations: [ManageSubadminInfoPage]
})
export class ManageSubadminInfoPageModule {}
