import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LogTempPage } from './log-temp.page';

const routes: Routes = [
  {
    path: '',
    component: LogTempPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogTempPageRoutingModule {}
