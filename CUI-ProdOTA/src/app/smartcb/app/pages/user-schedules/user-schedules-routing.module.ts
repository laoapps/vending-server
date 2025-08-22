import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserSchedulePage } from './user-schedule.page';

const routes: Routes = [
  {
    path: '',
    component: UserSchedulePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserSchedulePageRoutingModule {}
