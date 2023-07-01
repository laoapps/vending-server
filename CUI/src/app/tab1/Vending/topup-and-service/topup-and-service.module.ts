import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TopupAndServicePageRoutingModule } from './topup-and-service-routing.module';

import { TopupAndServicePage } from './topup-and-service.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TopupAndServicePageRoutingModule
  ],
  declarations: [TopupAndServicePage]
})
export class TopupAndServicePageModule {}
