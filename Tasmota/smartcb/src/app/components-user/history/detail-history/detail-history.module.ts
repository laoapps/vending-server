import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetailHistoryPageRoutingModule } from './detail-history-routing.module';

import { DetailHistoryPage } from './detail-history.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetailHistoryPageRoutingModule
  ],
  declarations: [DetailHistoryPage]
})
export class DetailHistoryPageModule {}
