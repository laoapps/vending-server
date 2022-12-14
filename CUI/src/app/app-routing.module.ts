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
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
