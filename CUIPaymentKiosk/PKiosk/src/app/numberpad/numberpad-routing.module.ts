import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NumberpadPage } from './numberpad.page';

const routes: Routes = [
  {
    path: '',
    component: NumberpadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NumberpadPageRoutingModule {}
