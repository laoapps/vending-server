import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PublicAdminManagePageRoutingModule } from './public-admin-manage-routing.module';

import { PublicAdminManagePage } from './public-admin-manage.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PublicAdminManagePageRoutingModule
  ],
  declarations: [PublicAdminManagePage]
})
export class PublicAdminManagePageModule {}
