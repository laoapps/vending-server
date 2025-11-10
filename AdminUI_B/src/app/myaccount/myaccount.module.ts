import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyaccountPageRoutingModule } from './myaccount-routing.module';

import { MyaccountPage } from './myaccount.page';
import { SharesModule } from './shares/shares.module';
import { CoinTransferComponent } from './shares/components/coin-transfer/coin-transfer.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyaccountPageRoutingModule,
    SharesModule
  ],
  declarations: [MyaccountPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyaccountPageModule {}
