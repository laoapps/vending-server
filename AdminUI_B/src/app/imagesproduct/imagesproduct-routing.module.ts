import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ImagesproductPage } from './imagesproduct.page';

const routes: Routes = [
  {
    path: '',
    component: ImagesproductPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImagesproductPageRoutingModule {}
