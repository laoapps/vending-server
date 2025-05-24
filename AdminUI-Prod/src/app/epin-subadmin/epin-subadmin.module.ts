import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpinSubadminPageRoutingModule } from './epin-subadmin-routing.module';

import { EpinSubadminPage } from './epin-subadmin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpinSubadminPageRoutingModule
  ],
  declarations: [EpinSubadminPage]
})
export class EpinSubadminPageModule {}
