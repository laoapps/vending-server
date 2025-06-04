import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqttClient.service';

@Component({
  selector: 'app-user-schedule',
  templateUrl: './user-schedule.page.html',
  styleUrls: ['./user-schedule.page.scss'],
  standalone: false
})
export class UserSchedulePage implements OnInit {
  devices: any[] = [];
  schedules: any[] = [];
  schedulePackages: any[] = [];
  selectedDeviceId: number | null = null;
  selectedPackageId: number | null = null;

  constructor(private apiService: ApiService, private mqttService: MqttClientService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getDevices().subscribe((devices) => {
      this.devices = devices;
      this.devices.forEach((device) => {
        this.mqttService.subscribeToDevice(device.tasmotaId).subscribe((message:any) => {
          device.status = JSON.parse(message.payload.toString());
        });
        this.mqttService.subscribeToTelemetry(device.tasmotaId).subscribe((message:any) => {
          const data = JSON.parse(message.payload.toString());
          device.power = data?.ENERGY?.Power || 0;
          device.energy = data?.ENERGY?.Total || 0;
        });
      });
    });

    this.apiService.getSchedules().subscribe((schedules) => {
      this.schedules = schedules;
    });

    this.apiService.getSchedulePackages().subscribe((packages) => {
      this.schedulePackages = packages;
    });
  }

  applySchedulePackage() {
    if (this.selectedDeviceId && this.selectedPackageId) {
      this.apiService.applySchedulePackage(this.selectedDeviceId, this.selectedPackageId).subscribe(() => {
        this.loadData();
        this.selectedDeviceId = null;
        this.selectedPackageId = null;
      });
    }
  }
}