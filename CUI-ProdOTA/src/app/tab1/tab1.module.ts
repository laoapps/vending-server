import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { Tab1PageRoutingModule } from './tab1-routing.module';
// import { NotifierModule } from 'angular-notifier';
import { OrderModule } from 'ngx-order-pipe';
import { AutoPaymentPageModule } from './Vending/auto-payment/auto-payment.module';

import { HangmiStoreSegmentPage } from './VendingSegment/hangmi-store-segment/hangmi-store-segment.page';
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
    OrderModule,
    AutoPaymentPageModule
  ],
  declarations: [Tab1Page]
})
export class Tab1PageModule {}
