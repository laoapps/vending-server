import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddGroupsPageRoutingModule } from './add-groups-routing.module';

import { AddGroupsPage } from './add-groups.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddGroupsPageRoutingModule
  ],
  declarations: [AddGroupsPage]
})
export class AddGroupsPageModule {}
