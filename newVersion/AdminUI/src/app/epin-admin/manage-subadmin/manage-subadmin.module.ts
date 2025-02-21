import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageSubadminPageRoutingModule } from './manage-subadmin-routing.module';

import { ManageSubadminPage } from './manage-subadmin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageSubadminPageRoutingModule
  ],
  declarations: [ManageSubadminPage]
})
export class ManageSubadminPageModule {}
