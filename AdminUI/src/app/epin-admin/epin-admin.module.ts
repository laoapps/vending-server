import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpinAdminPageRoutingModule } from './epin-admin-routing.module';

import { EpinAdminPage } from './epin-admin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpinAdminPageRoutingModule
  ],
  declarations: [EpinAdminPage]
})
export class EpinAdminPageModule {}
