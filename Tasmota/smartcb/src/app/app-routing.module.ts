import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
import { HomePage } from '../app/home/home.page';
import { AdminReportsPage } from './pages/admin-reports/admin-reports.page';
import { UserSchedulesPage } from './pages/user-schedules/user-schedule.page';
import { AdminUnregisteredDevicesPage } from './pages/admin-unregistered-devices/admin-unregistered-devices.page';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'admin-dashboard', component: AdminDashboardPage },
  { path: 'owner-dashboard', component: OwnerDashboardPage },
  { path: 'user-dashboard', component: UserDashboardPage },
  { path: 'admin-reports', component: AdminReportsPage },
  { path: 'user-schedule', component: UserSchedulesPage },
  { path: 'admin-unregistered-devices', component: AdminUnregisteredDevicesPage }

 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}