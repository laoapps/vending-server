import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GenerateCqrPage } from './generate-cqr.page';

const routes: Routes = [
  {
    path: '',
    component: GenerateCqrPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GenerateCqrPageRoutingModule {}
