import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CqrScanPage } from './cqr-scan.page';

const routes: Routes = [
  {
    path: '',
    component: CqrScanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CqrScanPageRoutingModule {}
