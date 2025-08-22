import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.page.html',
  styleUrls: ['./admin-reports.page.scss'],
  standalone: false
})
export class AdminReportsPage implements OnInit {
  reports: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getAllData().subscribe((data) => {
      this.reports = data.devices; // Placeholder for reports
    });
  }
}