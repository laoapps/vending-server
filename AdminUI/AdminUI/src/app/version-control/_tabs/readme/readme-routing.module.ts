import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReadmePage } from './readme.page';

const routes: Routes = [
  {
    path: '',
    component: ReadmePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReadmePageRoutingModule {}
