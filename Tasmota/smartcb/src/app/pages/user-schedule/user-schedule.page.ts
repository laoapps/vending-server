import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-user-schedule',
  templateUrl: './user-schedule.page.html',
  styleUrls: ['./user-schedule.page.scss'],
  standalone: false
})
export class UserSchedulePage implements OnInit {
  schedulePackages: any[] = [];
  devices: any[] = [];
  schedules: any[] = [];

  constructor(private apiService: ApiService, private alertController: AlertController) {}

  ngOnInit() {
    this.loadSchedulePackages();
    this.loadDevices();
    this.loadSchedules();
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

  loadSchedules() {
    this.apiService.getSchedules().subscribe(
      (schedules) => {
        this.schedules = schedules;
      },
      (error) => {
        console.error('Failed to load schedules:', error);
      }
    );
  }

  async applySchedulePackage(deviceId: number, packageId: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Application',
      message: 'Are you sure you want to apply this schedule package?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Apply',
          handler: () => {
            this.apiService.applySchedulePackage(deviceId, packageId).subscribe(
              () => {
                this.loadSchedules();
              },
              (error) => {
                console.error('Failed to apply schedule package:', error);
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }
}