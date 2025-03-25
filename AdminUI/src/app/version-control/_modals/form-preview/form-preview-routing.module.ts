import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormPreviewPage } from './form-preview.page';

const routes: Routes = [
  {
    path: '',
    component: FormPreviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormPreviewPageRoutingModule {}
