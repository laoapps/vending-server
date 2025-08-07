import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-user-schedules',
  templateUrl: './user-schedules.page.html',
  styleUrls: ['./user-schedules.page.scss'],
  standalone: false
})
export class UserSchedulesPage implements OnInit {
  schedulePackages: any[] = [];
  devices: any[] = [];
  schedules: any[] = [];

  constructor(private apiService: ApiService, private alertController: AlertController) {}

  ngOnInit() {
    this.loadSchedulePackages();
    this.loadDevices();
  }

  loadSchedulePackages() {
    this.apiService.getSchedulePackages().subscribe(
      (packages) => {
        this.schedulePackages = packages;
      },
      (error) => {
        console.error('Failed to load schedule packages:', error);
      }
    );
  }

  loadDevices() {
    this.apiService.getDevices().subscribe(
      (devices) => {
        this.devices = devices;
      },
      (error) => {
        console.error('Failed to load devices:', error);
      }
    );
  }
}