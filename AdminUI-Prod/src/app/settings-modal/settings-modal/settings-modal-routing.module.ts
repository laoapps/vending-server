import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsModalPage } from './settings-modal.page';

const routes: Routes = [
  {
    path: '',
    component: SettingsModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsModalPageRoutingModule {}
