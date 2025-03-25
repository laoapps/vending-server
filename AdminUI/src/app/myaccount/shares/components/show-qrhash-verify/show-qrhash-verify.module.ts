import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShowQrhashVerifyPageRoutingModule } from './show-qrhash-verify-routing.module';

import { ShowQrhashVerifyPage } from './show-qrhash-verify.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShowQrhashVerifyPageRoutingModule
  ],
  declarations: [ShowQrhashVerifyPage]
})
export class ShowQrhashVerifyPageModule {}
