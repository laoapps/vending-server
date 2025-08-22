import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListAllGroupsPageRoutingModule } from './list-all-groups-routing.module';

import { ListAllGroupsPage } from './list-all-groups.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListAllGroupsPageRoutingModule
  ],
  declarations: [ListAllGroupsPage]
})
export class ListAllGroupsPageModule {}
