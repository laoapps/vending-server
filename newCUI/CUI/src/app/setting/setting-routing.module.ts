import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingPage } from './setting.page';
import { SettingControlMenuPageModule } from './pages/setting-control-menu/setting-control-menu.module';

const routes: Routes = [
  {
    path: '',
    component: SettingPage
  },
  // {
  //   path: 'setting-control-menu',
  //   loadChildren: () => import('./pages/setting-control-menu/setting-control-menu.module').then( m => m.SettingControlMenuPageModule)
  // }
  {
    path: 'setting-control-menu',
    loadChildren: () =>SettingControlMenuPageModule
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingPageRoutingModule {}
