import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'qrpay',
    loadChildren: () => import('./qrpay/qrpay.module').then( m => m.QrpayPageModule)
  },
  {
    path: 'paymentmethod',
    loadChildren: () => import('./paymentmethod/paymentmethod.module').then( m => m.PaymentmethodPageModule)
  },
  {
    path: 'setting',
    loadChildren: () => import('./setting/setting.module').then( m => m.SettingPageModule)
  },
  {
    path: 'stock',
    loadChildren: () => import('./stock/stock.module').then( m => m.StockPageModule)
  },
  {
    path: 'stocksale',
    loadChildren: () => import('./stocksale/stocksale.module').then( m => m.StocksalePageModule)
  },
  {
    path: 'showcart',
    loadChildren: () => import('./showcart/showcart.module').then( m => m.ShowcartPageModule)
  },
  {
    path: 'dice',
    loadChildren: () => import('./dice/dice.module').then( m => m.DicePageModule)
  },
  {
    path: 'prizelist',
    loadChildren: () => import('./prizelist/prizelist.module').then( m => m.PrizelistPageModule)
  },
  {
    path: 'reportbills',
    loadChildren: () => import('./reportbills/reportbills.module').then( m => m.ReportbillsPageModule)
  },
  {
    path: 'reportrefillsale',
    loadChildren: () => import('./reportrefillsale/reportrefillsale.module').then( m => m.ReportrefillsalePageModule)
  },
  {
    path: 'remainingbills',
    loadChildren: () => import('./remainingbills/remainingbills.module').then( m => m.RemainingbillsPageModule)
  },
  {
    path: 'remainingbilllocal',
    loadChildren: () => import('./remainingbilllocal/remainingbilllocal.module').then( m => m.RemainingbilllocalPageModule)
  },
  {
    path: 'howto',
    loadChildren: () => import('./howto/howto.module').then( m => m.HowtoPageModule)
  },
  {
    path: 'customloading',
    loadChildren: () => import('./customloading/customloading.module').then( m => m.CustomloadingPageModule)
  },
  {
    path: 'ads',
    loadChildren: () => import('./ads/ads.module').then( m => m.AdsPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
