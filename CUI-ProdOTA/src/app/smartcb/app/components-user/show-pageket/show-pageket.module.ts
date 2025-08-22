import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShowPageketPageRoutingModule } from './show-pageket-routing.module';

import { ShowPageketPage } from './show-pageket.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShowPageketPageRoutingModule
  ],
  declarations: [ShowPageketPage]
})
export class ShowPageketPageModule {}
