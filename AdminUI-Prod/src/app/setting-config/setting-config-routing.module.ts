import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingConfigPage } from './setting-config.page';

const routes: Routes = [
  {
    path: '',
    component: SettingConfigPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingConfigPageRoutingModule {}
