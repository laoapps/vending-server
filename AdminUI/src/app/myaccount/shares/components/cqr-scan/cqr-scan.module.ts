import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CqrScanPageRoutingModule } from './cqr-scan-routing.module';

import { CqrScanPage } from './cqr-scan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CqrScanPageRoutingModule
  ],
  declarations: [CqrScanPage]
})
export class CqrScanPageModule {}
