import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TopupServicePageRoutingModule } from './topup-service-routing.module';

import { TopupServicePage } from './topup-service.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TopupServicePageRoutingModule
  ],
  declarations: [TopupServicePage]
})
export class TopupServicePageModule {}
