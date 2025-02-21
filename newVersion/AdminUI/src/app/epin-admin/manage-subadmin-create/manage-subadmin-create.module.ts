import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageSubadminCreatePageRoutingModule } from './manage-subadmin-create-routing.module';

import { ManageSubadminCreatePage } from './manage-subadmin-create.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageSubadminCreatePageRoutingModule
  ],
  declarations: [ManageSubadminCreatePage]
})
export class ManageSubadminCreatePageModule {}
