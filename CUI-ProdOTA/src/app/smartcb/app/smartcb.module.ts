// import { NgModule } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { IonicModule } from '@ionic/angular';
// import { HttpClientModule } from '@angular/common/http';
// import { FormsModule } from '@angular/forms';
// import { AppComponent } from './app.component';
// import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
// import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
// import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
// import { HomePage } from './home/home.page';
// import {UserSchedulesPage} from './pages/user-schedules/user-schedule.page'
// import {AdminReportsPage} from './pages/admin-reports/admin-reports.page';
// import { AdminUnregisteredDevicesPage } from './pages/admin-unregistered-devices/admin-unregistered-devices.page';
// import { IonicStorageModule } from '@ionic/storage-angular';
// @NgModule({
//   declarations: [
//     AppComponent,
//     AdminDashboardPage,
//     OwnerDashboardPage,
//     UserDashboardPage,
//     UserSchedulesPage,
//     AdminReportsPage,
//     AdminUnregisteredDevicesPage,
//     HomePage
//   ],
//   imports: [
//     BrowserModule,
//     IonicModule.forRoot({ innerHTMLTemplatesEnabled: true }),
//     HttpClientModule,
//     FormsModule,
//     IonicStorageModule.forRoot(),
//   ],
//   bootstrap: [AppComponent]
// })
// export class SmartcbModule {}

import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { LoginPage } from './auth/login/login.page';
import { HomePage } from './home/home.page';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
import { SmartcbRoutingModule } from './smartcb-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { RouteReuseStrategy } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    HomePage,
    AdminDashboardPage,
    OwnerDashboardPage,
    UserDashboardPage
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  imports: [
    // BrowserModule,
    CommonModule,
    IonicModule.forRoot({ innerHTMLTemplatesEnabled: true }),
    HttpClientModule,
    SmartcbRoutingModule,
    FormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Already present, which is fine
})
export class SmartcbModule {}
