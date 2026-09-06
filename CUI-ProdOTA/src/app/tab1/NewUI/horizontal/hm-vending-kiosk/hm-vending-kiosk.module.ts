import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HmVendingKioskPageRoutingModule } from './hm-vending-kiosk-routing.module';

import { HmVendingKioskPage } from './hm-vending-kiosk.page';
import { HmCheckoutDockComponent } from '../hm-checkout-dock/hm-checkout-dock.component';
import {HmAdsBannerComponent} from '../hm-ads-banner/hm-ads-banner.component';
import {HmAttractComponent} from '../hm-attract/hm-attract.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HmVendingKioskPageRoutingModule,
    HmCheckoutDockComponent,
    HmAdsBannerComponent,
    HmAttractComponent
  ],
  declarations: [HmVendingKioskPage]
})
export class HmVendingKioskPageModule {}
