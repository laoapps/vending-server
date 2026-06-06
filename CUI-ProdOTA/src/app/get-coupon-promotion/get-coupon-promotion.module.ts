import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GetCouponPromotionPageRoutingModule } from './get-coupon-promotion-routing.module';

import { GetCouponPromotionPage } from './get-coupon-promotion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GetCouponPromotionPageRoutingModule
  ],
  declarations: [GetCouponPromotionPage]
})
export class GetCouponPromotionPageModule {}
