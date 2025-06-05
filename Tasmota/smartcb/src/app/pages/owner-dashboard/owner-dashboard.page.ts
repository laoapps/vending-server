import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqttClient.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './owner-dashboard.page.html',
  styleUrls: ['./owner-dashboard.page.scss'],
  standalone: false
})
export class OwnerDashboardPage implements OnInit {
  devices: any[] = [];
  groups: any[] = [];
  schedules: any[] = [];
  schedulePackages: any[] = [];
  newDevice = { name: '', tasmotaId: '', zone: '' };
  newGroup = { name: '' };
  newSchedule = { deviceId: null, type: 'timer', cron: '', command: '', conditionType: '', conditionValue: null };
  newSchedulePackage = { name: '', price: 0, conditionType: 'time_duration', conditionValue: 0 };
  assignDevice = { groupId: null, deviceId: null };
  assignUser = { deviceId: null, token: '' };

  constructor(
    private apiService: ApiService,
    private mqttService: MqttClientService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getDevices().subscribe((devices) => {
      this.devices = devices;
      this.devices.forEach((device) => {
        this.mqttService.subscribeToDevice(device.tasmotaId).subscribe((message) => {
          device.status = JSON.parse(message.payload.toString());
        });
        this.mqttService.subscribeToTelemetry(device.tasmotaId).subscribe((message) => {
          const data = JSON.parse(message.payload.toString());
          device.power = data?.ENERGY?.Power || 0;
          device.energy = data?.ENERGY?.Total || 0;
        });
      });
    });
    this.apiService.getGroups().subscribe((groups) => {
      this.groups = groups;
    });
    this.apiService.getSchedules().subscribe((schedules) => {
      this.schedules = schedules;
    });
    this.apiService.getSchedulePackages().subscribe((packages) => {
      this.schedulePackages = packages;
    });
  }

  async addSchedulePackage() {
    if (!this.newSchedulePackage.name || this.newSchedulePackage.price <= 0 || this.newSchedulePackage.conditionValue <= 0) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please fill in all fields with valid values.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.apiService.createSchedulePackage(
      this.newSchedulePackage.name,
      this.newSchedulePackage.conditionValue,
      this.newSchedulePackage.conditionType === 'energy_consumption' ? this.newSchedulePackage.conditionValue : undefined,
      this.newSchedulePackage.price
    ).subscribe(
      () => {
        this.loadData();
        this.newSchedulePackage = { name: '', price: 0, conditionType: 'time_duration', conditionValue: 0 };
      },
      (error) => {
        console.error('Failed to create schedule package:', error);
      }
    );
  }

  async deleteSchedulePackage(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this schedule package?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.apiService.deleteSchedulePackage(id).subscribe(
              () => {
                this.loadData();
              },
              (error) => {
                console.error('Failed to delete schedule package:', error);
              }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  // Other methods (addDevice, updateDevice, etc.) remain unchanged
}