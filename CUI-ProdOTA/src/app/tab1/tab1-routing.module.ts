import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';
import { LaabGoPageModule } from './LAAB/laab-go/laab-go.module';
import { EpinCashOutPageModule } from './LAAB/epin-cash-out/epin-cash-out.module';
import { EpinShowCodePageModule } from './LAAB/epin-show-code/epin-show-code.module';
import { SmcListPageModule } from './LAAB/smc-list/smc-list.module';
import { LaabCashinShowCodePageModule } from './LAAB/laab-cashin-show-code/laab-cashin-show-code.module';
import { LaabCashoutPageModule } from './LAAB/laab-cashout/laab-cashout.module';
import { StackCashoutPageModule } from './LAAB/stack-cashout/stack-cashout.module';
import { MmoneyIosAndroidDownloadPageModule } from './MMoney/mmoney-ios-android-download/mmoney-ios-android-download.module';
import { TopupServicePageModule } from './LAAB/topup-service/topup-service.module';
import { TopupAndServicePageModule } from './Vending/topup-and-service/topup-and-service.module';
import { PhonePaymentPageModule } from './Vending/phone-payment/phone-payment.module';
import { VendingGoPageModule } from './Vending/vending-go/vending-go.module';
import { HowToPageModule } from './Vending/how-to/how-to.module';
import { MmoneyCashoutPageModule } from './LAAB/mmoney-cashout/mmoney-cashout.module';
import { HangmiStoreSegmentPageModule } from './VendingSegment/hangmi-store-segment/hangmi-store-segment.module';
import { HangmiFoodSegmentPageModule } from './VendingSegment/hangmi-food-segment/hangmi-food-segment.module';
import { TopupAndServiceSegmentPageModule } from './VendingSegment/topup-and-service-segment/topup-and-service-segment.module';
import { PlayGamesPageModule } from './Vending/play-games/play-games.module';
import { OrderCartPageModule } from './Vending/order-cart/order-cart.module';
import { OrderPaidPageModule } from './Vending/order-paid/order-paid.module';
import { AutoPaymentPageModule } from './Vending/auto-payment/auto-payment.module';
import { UserSchedulePageModule } from '../smartcb/app/pages/user-schedules/user-schedules.module';
import { AdminUnregisteredDevicesPageModule } from '../smartcb/app/pages/admin-unregistered-devices/admin-unregistered-devices.module';
import { AdminReportsPageModule } from '../smartcb/app/pages/admin-reports/admin-reports.module';
import { LoginPageModule } from '../smartcb/app/auth/login/login.module';
const routes: Routes = [
  // {
  //   path: '',
  //   component: Tab1Page,
  // },
  // {
  //   path: 'laab-go',
  //   loadChildren: () => import('./LAAB/laab-go/laab-go.module').then( m => m.LaabGoPageModule)
  // },
  // {
  //   path: 'epin-cash-out',
  //   loadChildren: () => import('./LAAB/epin-cash-out/epin-cash-out.module').then( m => m.EpinCashOutPageModule)
  // },
  // {
  //   path: 'epin-show-code',
  //   loadChildren: () => import('./LAAB/epin-show-code/epin-show-code.module').then( m => m.EpinShowCodePageModule)
  // },
  // {
  //   path: 'smc-list',
  //   loadChildren: () => import('./LAAB/smc-list/smc-list.module').then( m => m.SmcListPageModule)
  // },
  // {
  //   path: 'laab-cashin-show-code',
  //   loadChildren: () => import('./LAAB/laab-cashin-show-code/laab-cashin-show-code.module').then( m => m.LaabCashinShowCodePageModule)
  // },
  // {
  //   path: 'laab-cashout',
  //   loadChildren: () => import('./LAAB/laab-cashout/laab-cashout.module').then( m => m.LaabCashoutPageModule)
  // },
  // {
  //   path: 'stack-cashout',
  //   loadChildren: () => import('./LAAB/stack-cashout/stack-cashout.module').then( m => m.StackCashoutPageModule)
  // },
  // {
  //   path: 'mmoney-ios-android-download',
  //   loadChildren: () => import('./MMoney/mmoney-ios-android-download/mmoney-ios-android-download.module').then( m => m.MmoneyIosAndroidDownloadPageModule)
  // },
  // {
  //   path: 'topup-service',
  //   loadChildren: () => import('./LAAB/topup-service/topup-service.module').then( m => m.TopupServicePageModule)
  // },
  // {
  //   path: 'topup-and-service',
  //   loadChildren: () => import('./Vending/topup-and-service/topup-and-service.module').then( m => m.TopupAndServicePageModule)
  // },
  // {
  //   path: 'phone-payment',
  //   loadChildren: () => import('./Vending/phone-payment/phone-payment.module').then( m => m.PhonePaymentPageModule)
  // },
  // {
  //   path: 'vending-go',
  //   loadChildren: () => import('./Vending/vending-go/vending-go.module').then( m => m.VendingGoPageModule)
  // },
  // {
  //   path: 'how-to',
  //   loadChildren: () => import('./Vending/how-to/how-to.module').then( m => m.HowToPageModule)
  // },
  // {
  //   path: 'mmoney-cashout',
  //   loadChildren: () => import('./LAAB/mmoney-cashout/mmoney-cashout.module').then( m => m.MmoneyCashoutPageModule)
  // },
  // {
  //   path: 'hangmi-store-segment',
  //   loadChildren: () => import('./VendingSegment/hangmi-store-segment/hangmi-store-segment.module').then( m => m.HangmiStoreSegmentPageModule)
  // },
  // {
  //   path: 'hangmi-food-segment',
  //   loadChildren: () => import('./VendingSegment/hangmi-food-segment/hangmi-food-segment.module').then( m => m.HangmiFoodSegmentPageModule)
  // },
  // {
  //   path: 'topup-and-service-segment',
  //   loadChildren: () => import('./VendingSegment/topup-and-service-segment/topup-and-service-segment.module').then( m => m.TopupAndServiceSegmentPageModule)
  // },
  // {
  //   path: 'play-games',
  //   loadChildren: () => import('./Vending/play-games/play-games.module').then( m => m.PlayGamesPageModule)
  // },
  // {
  //   path: 'order-cart',
  //   loadChildren: () => import('./Vending/order-cart/order-cart.module').then( m => m.OrderCartPageModule)
  // },
  // {
  //   path: 'order-paid',
  //   loadChildren: () => import('./Vending/order-paid/order-paid.module').then( m => m.OrderPaidPageModule)
  // },
  // {
  //   path: 'auto-payment',
  //   loadChildren: () => import('./Vending/auto-payment/auto-payment.module').then( m => m.AutoPaymentPageModule)
  // }
  {
    path: '',
    component: Tab1Page,
  },
  {
    path: 'laab-go',
    loadChildren: () => LaabGoPageModule
  },
  {
    path: 'epin-cash-out',
    loadChildren: () => EpinCashOutPageModule
  },
  {
    path: 'epin-show-code',
    loadChildren: () => EpinShowCodePageModule
  },
  {
    path: 'smc-list',
    loadChildren: () => SmcListPageModule
  },
  {
    path: 'laab-cashin-show-code',
    loadChildren: () => LaabCashinShowCodePageModule
  },
  {
    path: 'laab-cashout',
    loadChildren: () => LaabCashoutPageModule
  },
  {
    path: 'stack-cashout',
    loadChildren: () => StackCashoutPageModule
  },
  {
    path: 'mmoney-ios-android-download',
    loadChildren: () => MmoneyIosAndroidDownloadPageModule
  },
  {
    path: 'topup-service',
    loadChildren: () => TopupServicePageModule
  },
  {
    path: 'topup-and-service',
    loadChildren: () => TopupAndServicePageModule
  },
  {
    path: 'phone-payment',
    loadChildren: () => PhonePaymentPageModule
  },
  {
    path: 'vending-go',
    loadChildren: () => VendingGoPageModule
  },
  {
    path: 'how-to',
    loadChildren: () => HowToPageModule
  },
  {
    path: 'mmoney-cashout',
    loadChildren: () => MmoneyCashoutPageModule
  },
  {
    path: 'hangmi-store-segment',
    loadChildren: () => HangmiStoreSegmentPageModule
  },
  {
    path: 'hangmi-food-segment',
    loadChildren: () => HangmiFoodSegmentPageModule
  },
  {
    path: 'topup-and-service-segment',
    loadChildren: () => TopupAndServiceSegmentPageModule
  },
  {
    path: 'play-games',
    loadChildren: () => PlayGamesPageModule
  },
  {
    path: 'order-cart',
    loadChildren: () => OrderCartPageModule
  },
  {
    path: 'order-paid',
    loadChildren: () => OrderPaidPageModule
  },
  {
    path: 'auto-payment',
    loadChildren: () => AutoPaymentPageModule
  },
  {
    path: 'user-schedules',
    loadChildren: () => UserSchedulePageModule
  },
  {
    path:'admin-unregistered-devices',
    loadChildren: () => AdminUnregisteredDevicesPageModule
  },
  {
    path: 'admin-reports',
    loadChildren: () => AdminReportsPageModule
  },
  {
    path:'smart-cb-login',
    loadChildren: () => LoginPageModule
  }


  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tab1PageRoutingModule {}
