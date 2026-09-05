import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HmVendingV2Page } from './hm-vending-v2.page';

const routes: Routes = [{ path: '', component: HmVendingV2Page }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HmVendingV2PageRoutingModule {}
