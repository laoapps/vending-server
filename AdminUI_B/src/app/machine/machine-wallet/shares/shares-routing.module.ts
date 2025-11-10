import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharesModule } from './shares.module';

const routes: Routes = [
  {
    path: '',
    component: SharesModule
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SharesModuleRoutingModule {}
