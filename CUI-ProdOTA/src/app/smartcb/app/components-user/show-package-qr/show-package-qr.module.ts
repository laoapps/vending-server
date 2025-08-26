import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShowPackageQrPageRoutingModule } from './show-package-qr-routing.module';

import { ShowPackageQrPage } from './show-package-qr.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShowPackageQrPageRoutingModule
  ],
  declarations: [ShowPackageQrPage]
})
export class ShowPackageQrPageModule {}
