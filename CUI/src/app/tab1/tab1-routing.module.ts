import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';

const routes: Routes = [
  {
    path: '',
    component: Tab1Page,
  },
  {
    path: 'laab-go',
    loadChildren: () => import('./LAAB/laab-go/laab-go.module').then( m => m.LaabGoPageModule)
  },
  {
    path: 'epin-cash-out',
    loadChildren: () => import('./LAAB/epin-cash-out/epin-cash-out.module').then( m => m.EpinCashOutPageModule)
  },
  {
    path: 'epin-show-code',
    loadChildren: () => import('./LAAB/epin-show-code/epin-show-code.module').then( m => m.EpinShowCodePageModule)
  },
  {
    path: 'smc-list',
    loadChildren: () => import('./LAAB/smc-list/smc-list.module').then( m => m.SmcListPageModule)
  },
  {
    path: 'laab-cashin-show-code',
    loadChildren: () => import('./LAAB/laab-cashin-show-code/laab-cashin-show-code.module').then( m => m.LaabCashinShowCodePageModule)
  },
  {
    path: 'laab-cashout',
    loadChildren: () => import('./LAAB/laab-cashout/laab-cashout.module').then( m => m.LaabCashoutPageModule)
  },
  {
    path: 'stack-cashout',
    loadChildren: () => import('./LAAB/stack-cashout/stack-cashout.module').then( m => m.StackCashoutPageModule)
  },
  {
    path: 'mmoney-ios-android-download',
    loadChildren: () => import('./MMoney/mmoney-ios-android-download/mmoney-ios-android-download.module').then( m => m.MmoneyIosAndroidDownloadPageModule)
  },
  {
    path: 'topup-service',
    loadChildren: () => import('./LAAB/topup-service/topup-service.module').then( m => m.TopupServicePageModule)
  },
  {
    path: 'topup-and-service',
    loadChildren: () => import('./Vending/topup-and-service/topup-and-service.module').then( m => m.TopupAndServicePageModule)
  },
  {
    path: 'phone-payment',
    loadChildren: () => import('./Vending/phone-payment/phone-payment.module').then( m => m.PhonePaymentPageModule)
  },
  {
    path: 'vending-go',
    loadChildren: () => import('./Vending/vending-go/vending-go.module').then( m => m.VendingGoPageModule)
  },
  {
    path: 'how-to',
    loadChildren: () => import('./Vending/how-to/how-to.module').then( m => m.HowToPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tab1PageRoutingModule {}
