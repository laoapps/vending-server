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
        this.schedules = schedules.map((schedule: any) => {
          if (schedule.package?.conditionType === 'energy_consumption' && schedule.startEnergy !== undefined && schedule.device?.energy !== undefined) {
            schedule.energyUsed = (schedule.device.energy - schedule.startEnergy).toFixed(2);
            schedule.energyRemaining = (schedule.package.conditionValue - schedule.energyUsed).toFixed(2);
          }
          return schedule;
        });
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