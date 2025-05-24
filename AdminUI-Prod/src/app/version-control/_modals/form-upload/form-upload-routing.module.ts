import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormUploadPage } from './form-upload.page';

const routes: Routes = [
  {
    path: '',
    component: FormUploadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormUploadPageRoutingModule {}
