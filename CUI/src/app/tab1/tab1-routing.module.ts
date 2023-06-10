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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tab1PageRoutingModule {}
