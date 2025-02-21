import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SmcListPageRoutingModule } from './smc-list-routing.module';

import { SmcListPage } from './smc-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SmcListPageRoutingModule
  ],
  declarations: [SmcListPage]
})
export class SmcListPageModule {}
