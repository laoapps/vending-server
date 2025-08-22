import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
import { HomePage } from '../app/home/home.page';
import { AdminReportsPage } from './pages/admin-reports/admin-reports.page';
import { UserSchedulesPage } from './pages/user-schedules/user-schedule.page';
import { AdminUnregisteredDevicesPage } from './pages/admin-unregistered-devices/admin-unregistered-devices.page';
import { LoginPage } from './auth/login/login.page';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'admin-dashboard', component: AdminDashboardPage },
  { path: 'owner-dashboard', component: OwnerDashboardPage },
  { path: 'user-dashboard', component: UserDashboardPage },
  { path: 'admin-reports', component: AdminReportsPage },
  { path: 'user-schedule', component: UserSchedulesPage },
  { path: 'admin-unregistered-devices', component: AdminUnregisteredDevicesPage },
  {
    path: 'notification',
    loadChildren: () => import('./pages/notification/notification.module').then( m => m.NotificationPageModule)
  },
  {
    path: 'notification',
    loadChildren: () => import('./pages/notification/notification.module').then( m => m.NotificationPageModule)
  },
  {
    path: 'owner',
    loadChildren: () => import('./pages/owner/owner.module').then( m => m.OwnerPageModule)
  },
  {
    path: 'pagekets',
    loadChildren: () => import('./components-owner/pagekets/pagekets.module').then( m => m.PageketsPageModule)
  },
  {
    path: 'add-pagekets',
    loadChildren: () => import('./components-owner/pagekets/add-pagekets/add-pagekets.module').then( m => m.AddPageketsPageModule)
  },
  {
    path: 'groups',
    loadChildren: () => import('./components-owner/groups/groups.module').then( m => m.GroupsPageModule)
  },
  {
    path: 'devices',
    loadChildren: () => import('./components-owner/devices/devices.module').then( m => m.DevicesPageModule)
  },
  {
    path: 'devices',
    loadChildren: () => import('./components-owner/devices/devices.module').then( m => m.DevicesPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./auth/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./pages/user/user.module').then( m => m.UserPageModule)
  },
  {
    path: 'status',
    loadChildren: () => import('./components-user/status/status.module').then( m => m.StatusPageModule)
  },
  {
    path: 'history',
    loadChildren: () => import('./components-user/history/history.module').then( m => m.HistoryPageModule)
  },
  {
    path: 'show-devices',
    loadChildren: () => import('./components-user/show-devices/show-devices.module').then( m => m.ShowDevicesPageModule)
  },
  {
    path: 'show-pageket',
    loadChildren: () => import('./components-user/show-pageket/show-pageket.module').then( m => m.ShowPageketPageModule)
  },
  {
    path: 'gen-qr-code',
    loadChildren: () => import('./components-owner/gen-qr-code/gen-qr-code.module').then( m => m.GenQrCodePageModule)
  },
  {
    path: 'list-devices-qr',
    loadChildren: () => import('./components-owner/list-devices-qr/list-devices-qr.module').then( m => m.ListDevicesQrPageModule)
  },
  {
    path: 'pay-qr',
    loadChildren: () => import('./components-user/pay-qr/pay-qr.module').then( m => m.PayQrPageModule)
  },
  {
    path: 'map',
    loadChildren: () => import('./components-user/map/map.module').then( m => m.MapPageModule)
  },
  {
    path: 'confirmcode',
    loadChildren: () => import('./auth/confirmcode/confirmcode.module').then( m => m.ConfirmcodePageModule)
  },
  {
    path: 'list-all-groups',
    loadChildren: () => import('./components-user/list-all-groups/list-all-groups.module').then( m => m.ListAllGroupsPageModule)
  },
  {
    path: 'control-order',
    loadChildren: () => import('./components-owner/control-order/control-order.module').then( m => m.ControlOrderPageModule)
  },
  {
    path: 'order',
    loadChildren: () => import('./components-user/order/order.module').then( m => m.OrderPageModule)
  },

 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}