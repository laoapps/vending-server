import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TestmotorPageRoutingModule } from './testmotor-routing.module';

import { TestmotorPage } from './testmotor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TestmotorPageRoutingModule
  ],
  declarations: [TestmotorPage]
})
export class TestmotorPageModule {}
