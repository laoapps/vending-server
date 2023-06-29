import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MmoneyIosAndroidDownloadPage } from './mmoney-ios-android-download.page';

const routes: Routes = [
  {
    path: '',
    component: MmoneyIosAndroidDownloadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MmoneyIosAndroidDownloadPageRoutingModule {}
