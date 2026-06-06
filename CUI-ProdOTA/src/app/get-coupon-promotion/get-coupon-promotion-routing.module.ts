import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GetCouponPromotionPage } from './get-coupon-promotion.page';

const routes: Routes = [
  {
    path: '',
    component: GetCouponPromotionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GetCouponPromotionPageRoutingModule {}
