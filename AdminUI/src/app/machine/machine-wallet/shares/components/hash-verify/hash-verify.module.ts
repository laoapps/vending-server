import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HashVerifyPageRoutingModule } from './hash-verify-routing.module';

import { HashVerifyPage } from './hash-verify.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HashVerifyPageRoutingModule
  ],
  declarations: [HashVerifyPage]
})
export class HashVerifyPageModule {}
