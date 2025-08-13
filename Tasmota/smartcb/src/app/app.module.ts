import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
import { HomePage } from './home/home.page';
import {UserSchedulesPage} from './pages/user-schedules/user-schedule.page'
import {AdminReportsPage} from './pages/admin-reports/admin-reports.page';
import { AdminUnregisteredDevicesPage } from './pages/admin-unregistered-devices/admin-unregistered-devices.page';
@NgModule({
  declarations: [
    AppComponent,
    AdminDashboardPage,
    OwnerDashboardPage,
    UserDashboardPage,
    UserSchedulesPage,
    AdminReportsPage,
    AdminUnregisteredDevicesPage,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({ innerHTMLTemplatesEnabled: true }),
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}