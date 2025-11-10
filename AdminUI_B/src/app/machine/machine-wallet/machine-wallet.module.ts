import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MachineWalletPageRoutingModule } from './machine-wallet-routing.module';

import { MachineWalletPage } from './machine-wallet.page';
import { SharesModule } from './shares/shares.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MachineWalletPageRoutingModule,
    SharesModule
  ],
  declarations: [MachineWalletPage]
})
export class MachineWalletPageModule {}
