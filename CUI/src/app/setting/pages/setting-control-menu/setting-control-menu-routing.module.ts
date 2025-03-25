import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingControlMenuPage } from './setting-control-menu.page';

const routes: Routes = [
  {
    path: '',
    component: SettingControlMenuPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingControlMenuPageRoutingModule {}
