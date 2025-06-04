import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
import { HomePage } from './home/home.page';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'admin-dashboard', component: AdminDashboardPage },
  { path: 'owner-dashboard', component: OwnerDashboardPage },
  { path: 'user-dashboard', component: UserDashboardPage },
  {
    path: 'admin-reports',
    loadChildren: () => import('./pages/admin-reports/admin-reports.module').then( m => m.AdminReportsPageModule)
  },
  {
    path: 'user-schedule',
    loadChildren: () => import('./pages/user-schedule/user-schedule.module').then( m => m.UserSchedulePageModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}