import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
})
export class AdminDashboardPage implements OnInit {
  data: any = { owners: [], devices: [], groups: [], schedules: [], userDevices: [] };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getAllData().subscribe((data) => {
      this.data = data;
    });
  }
}