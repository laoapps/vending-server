import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginPage } from './pages/login/login.page';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { OwnerDashboardPage } from './pages/owner-dashboard/owner-dashboard.page';
import { UserDashboardPage } from './pages/user-dashboard/user-dashboard.page';
import { HomePage } from './home/home.page';
import {UserSchedulePage} from './pages/user-schedule/user-schedule.page'
import {AdminReportsPage} from './pages/admin-reports/admin-reports.page';
@NgModule({
  declarations: [
    AppComponent,
    LoginPage,
    AdminDashboardPage,
    OwnerDashboardPage,
    UserDashboardPage,
    UserSchedulePage,
    AdminReportsPage,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}