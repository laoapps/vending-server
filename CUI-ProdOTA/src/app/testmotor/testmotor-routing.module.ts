import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestmotorPage } from './testmotor.page';

const routes: Routes = [
  {
    path: '',
    component: TestmotorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestmotorPageRoutingModule {}
