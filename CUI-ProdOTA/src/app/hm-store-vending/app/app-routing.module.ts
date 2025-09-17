import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'detail-product',
    loadChildren: () => import('./pages/detail-product/detail-product.module').then( m => m.DetailProductPageModule)
  },
  {
    path: 'pay-qr',
    loadChildren: () => import('./pages/pay-qr/pay-qr.module').then( m => m.PayQrPageModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./pages/cart/cart.module').then( m => m.CartPageModule)
  },
  {
    path: 'add-phonenumber',
    loadChildren: () => import('./pages/add-phonenumber/add-phonenumber.module').then( m => m.AddPhonenumberPageModule)
  },
];

@NgModule({
  imports: [
    // RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
      RouterModule.forChild(routes),
    
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
