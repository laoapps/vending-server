import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TabsPageModule } from './tabs/tabs.module';
import { QrpayPageModule } from './qrpay/qrpay.module';
import { PaymentmethodPageModule } from './paymentmethod/paymentmethod.module';
import { SettingPageModule } from './setting/setting.module';
import { StockPageModule } from './stock/stock.module';
import { StocksalePageModule } from './stocksale/stocksale.module';
import { ShowcartPageModule } from './showcart/showcart.module';
import { PrizelistPageModule } from './prizelist/prizelist.module';
import { ReportbillsPageModule } from './reportbills/reportbills.module';
import { ReportrefillsalePageModule } from './reportrefillsale/reportrefillsale.module';
import { RemainingbillsPageModule } from './remainingbills/remainingbills.module';
import { RemainingbilllocalPageModule } from './remainingbilllocal/remainingbilllocal.module';
import { HowtoPageModule } from './howto/howto.module';
import { CustomloadingPageModule } from './customloading/customloading.module';
import { AdsPageModule } from './ads/ads.module';
import { FortunewheelPageModule } from './fortunewheel/fortunewheel.module';
import { TestmotorPageModule } from './testmotor/testmotor.module';

const routes: Routes = [
  // {
  //   path: '',
  //   loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  // },
  // {
  //   path: 'qrpay',
  //   loadChildren: () => import('./qrpay/qrpay.module').then( m => m.QrpayPageModule)
  // },
  // {
  //   path: 'paymentmethod',
  //   loadChildren: () => import('./paymentmethod/paymentmethod.module').then( m => m.PaymentmethodPageModule)
  // },
  // {
  //   path: 'setting',
  //   loadChildren: () => import('./setting/setting.module').then( m => m.SettingPageModule)
  // },
  // {
  //   path: 'stock',
  //   loadChildren: () => import('./stock/stock.module').then( m => m.StockPageModule)
  // },
  // {
  //   path: 'stocksale',
  //   loadChildren: () => import('./stocksale/stocksale.module').then( m => m.StocksalePageModule)
  // },
  // {
  //   path: 'showcart',
  //   loadChildren: () => import('./showcart/showcart.module').then( m => m.ShowcartPageModule)
  // },
  // {
  //   path: 'prizelist',
  //   loadChildren: () => import('./prizelist/prizelist.module').then( m => m.PrizelistPageModule)
  // },
  // {
  //   path: 'reportbills',
  //   loadChildren: () => import('./reportbills/reportbills.module').then( m => m.ReportbillsPageModule)
  // },
  // {
  //   path: 'reportrefillsale',
  //   loadChildren: () => import('./reportrefillsale/reportrefillsale.module').then( m => m.ReportrefillsalePageModule)
  // },
  // {
  //   path: 'remainingbills',
  //   loadChildren: () => import('./remainingbills/remainingbills.module').then( m => m.RemainingbillsPageModule)
  // },
  // {
  //   path: 'remainingbilllocal',
  //   loadChildren: () => import('./remainingbilllocal/remainingbilllocal.module').then( m => m.RemainingbilllocalPageModule)
  // },
  // {
  //   path: 'howto',
  //   loadChildren: () => import('./howto/howto.module').then( m => m.HowtoPageModule)
  // },
  // {
  //   path: 'customloading',
  //   loadChildren: () => import('./customloading/customloading.module').then( m => m.CustomloadingPageModule)
  // },
  // {
  //   path: 'ads',
  //   loadChildren: () => import('./ads/ads.module').then( m => m.AdsPageModule)
  // },
  // {
  //   path: 'fortunewheel',
  //   loadChildren: () => import('./fortunewheel/fortunewheel.module').then( m => m.FortunewheelPageModule)
  // },
  // {
  //   path: 'testmotor',
  //   loadChildren: () => import('./testmotor/testmotor.module').then( m => m.TestmotorPageModule)
  // }
  {
    path: '',
    loadChildren: () => TabsPageModule
  },
  {
    path: 'qrpay',
    loadChildren: () => QrpayPageModule
  },
  {
    path: 'paymentmethod',
    loadChildren: () => PaymentmethodPageModule
  },
  {
    path: 'setting',
    loadChildren: () => SettingPageModule
  },
  {
    path: 'stock',
    loadChildren: () => StockPageModule
  },
  {
    path: 'stocksale',
    loadChildren: () => StocksalePageModule
  },
  {
    path: 'showcart',
    loadChildren: () => ShowcartPageModule
  },
  {
    path: 'prizelist',
    loadChildren: () => PrizelistPageModule
  },
  {
    path: 'reportbills',
    loadChildren: () => ReportbillsPageModule
  },
  {
    path: 'reportrefillsale',
    loadChildren: () => ReportrefillsalePageModule
  },
  {
    path: 'remainingbills',
    loadChildren: () => RemainingbillsPageModule
  },
  {
    path: 'remainingbilllocal',
    loadChildren: () => RemainingbilllocalPageModule
  },
  {
    path: 'howto',
    loadChildren: () => HowtoPageModule
  },
  {
    path: 'customloading',
    loadChildren: () => CustomloadingPageModule
  },
  {
    path: 'ads',
    loadChildren: () => AdsPageModule
  },
  {
    path: 'fortunewheel',
    loadChildren: () => FortunewheelPageModule
  },
  {
    path: 'testmotor',
    loadChildren: () => TestmotorPageModule
  },
  {
    path: 'close-stytem',
    loadChildren: () => import('./close-stytem/close-stytem.module').then(m => m.CloseStytemPageModule)
  },
  {
    path: 'qr-open-stock',
    loadChildren: () => import('./qr-open-stock/qr-open-stock.module').then( m => m.QrOpenStockPageModule)
  },
  {
    path: 'smartcb',
    loadChildren: () => import('./smartcb/app/smartcb.module').then(m => m.SmartcbModule)
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
