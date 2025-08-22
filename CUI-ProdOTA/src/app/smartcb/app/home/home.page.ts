import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { UserSchedulesPage } from '../pages/user-schedules/user-schedule.page';
import { OwnerDashboardPage } from '../pages/owner-dashboard/owner-dashboard.page';
import { LoadingService } from '../services/loading.service';
import { OwnerPage } from '../pages/owner/owner.page';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  role: string | null = null;
  token: string = '';

  constructor(private apiService: ApiService, private router: Router, public m:LoadingService,
    private navCtrl: NavController
  ) {
    if (!localStorage.getItem('token') || localStorage.getItem('token') == null) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
      this.loadRole();
    }
  }

  loadRole() {
    // this.setToken()
    this.apiService.getUserRole().subscribe(
      (response) => {
        console.log('loadRole',response.role);
        
        this.role = response.role;
      },
      () => {
        this.role = 'user'; // Default to client user if token is invalid
      }
    );
  }

  registerOwner() {
    this.apiService.registerOwner(this.token).subscribe(
      (response) => {
        localStorage.setItem('token', response.token);
        this.role = 'owner';
      },
      (error) => {
        console.error('Registration failed:', error);
      }
    );
  }

  navigateTos(page: string) {
    if (page === 'manage-devices') {
      this.navCtrl.navigateForward('/manage-devices');
    } else if (page === 'view-reports') {
      this.navCtrl.navigateForward('/view-reports');
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  //   setToken(){
  //   localStorage.setItem('token','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNpZ25hdHVyZSI6IjA0Nzk0ZGYwZGZkZTYxNWQ3ZjE1YjNlMTFjZTgzYzQzY2M1YjQ1MGI2NDY5MDQzYzUzNmVhYTUwMTk3MzExMWYzNmFmN2FhM2VkN2M5OTlkZTg2YTY3MWVmYjRiNTFhZTM2NzgwZjhiYmNlNjA3ZWFmOGYwZDYxMDg2YmM4NDg4NGMiLCJwaG9uZU51bWJlciI6Iis4NTYyMDU1NTE2MzIxIiwidXVpZCI6Ijg2MmY5NmEwLWFjNDUtMTFlZC1hZjA0LTU1ZmE3ZTc0ZTE5NCIsImlwIjoiMTkyLjE2OC44OC44MSIsIm1hY2hpbmUiOiJ3aW5kb3dzIiwib3RoZXJpbmZvIjoibGFvYXBwLmNvbSIsImxvY2F0aW9uIjoidmllbnRpYW5lIn0sImlhdCI6MTc0Njc4MDM1MCwiZXhwIjozNjAwMDAwMTc0Njc4MDM1MH0.JrBLY6pMgzL9iAIoZ1LFzCRWtxvHYUzvsSd2LHEh2xE')
  // }

    tomodal(page: any = '') {
    let getPage: any = ''
    if (page=='user') {
      getPage = UserSchedulesPage
    }else if(page=='owner'){
      // getPage = OwnerDashboardPage
      getPage = OwnerPage
    }
    this.m.showModal(getPage).then(r => {
      if (r) {
        r.present();
        r.onDidDismiss().then(res => {
          if (res.data.reload) {
          }
        })
      }
    })
  }

  logout() {
    // Example: Clear token and redirect to login page
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}