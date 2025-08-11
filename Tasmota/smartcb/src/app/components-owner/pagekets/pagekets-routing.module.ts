import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageketsPage } from './pagekets.page';

const routes: Routes = [
  {
    path: '',
    component: PageketsPage
  },
  {
    path: 'add-pagekets',
    loadChildren: () => import('./add-pagekets/add-pagekets.module').then( m => m.AddPageketsPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PageketsPageRoutingModule {}
