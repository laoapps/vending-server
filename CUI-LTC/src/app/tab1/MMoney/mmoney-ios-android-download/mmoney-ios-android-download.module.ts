import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MmoneyIosAndroidDownloadPageRoutingModule } from './mmoney-ios-android-download-routing.module';

import { MmoneyIosAndroidDownloadPage } from './mmoney-ios-android-download.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MmoneyIosAndroidDownloadPageRoutingModule
  ],
  declarations: [MmoneyIosAndroidDownloadPage]
})
export class MmoneyIosAndroidDownloadPageModule {}
