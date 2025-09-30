import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GivePopUpPageRoutingModule } from './give-pop-up-routing.module';

import { GivePopUpPage } from './give-pop-up.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GivePopUpPageRoutingModule
  ],
  declarations: [GivePopUpPage]
})
export class GivePopUpPageModule {}
