import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqtt.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.page.html',
})
export class UserDashboardPage implements OnInit {
  devices: any[] = [];

  constructor(private apiService: ApiService, private mqttService: MqttClientService) {}

  ngOnInit() {
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
  }

  togglePower(deviceId: number) {
    this.apiService.controlDevice(deviceId, 'POWER TOGGLE').subscribe();
  }
}