import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserSchedulesPage } from './user-schedule.page';



const routes: Routes = [
  {
    path: '',
    component: UserSchedulesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserSchedulePageRoutingModule {}
