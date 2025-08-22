import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserSchedulePageRoutingModule } from './user-schedules-routing.module';

import { UserSchedulesPage } from './user-schedule.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserSchedulePageRoutingModule
  ],
  declarations: [UserSchedulesPage]
})
export class UserSchedulePageModule {}
