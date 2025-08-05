import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqttClient.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.page.html',
  styleUrls: ['./user-dashboard.page.scss'],
  standalone: false
})
export class UserDashboardPage implements OnInit {
  devices: any[] = [];

  constructor(private apiService: ApiService, private mqttService: MqttClientService) { }

  ngOnInit() {
    this.apiService.getDevices().subscribe((devices) => {
      this.devices = devices;
      this.devices.forEach((device) => {
        this.mqttService.subscribeToDevice(device.tasmotaId).subscribe((message) => {
          // console.log('message',message);

          try {
            device.status = JSON.parse(message.payload.toString());
          } catch (error) {
            device.status = {status:message?.payload?.toString()};
          }


        });
        this.mqttService.subscribeToTelemetry(device.tasmotaId).subscribe((message) => {
          // console.log('message2 payload',message?.payload?.toString())
          try {
            const data = JSON.parse(message.payload.toString());
            device.power = data?.ENERGY?.Power || 0;
            device.energy = data?.ENERGY?.Total || 0;
          } catch (error) {
            device.status = {status:message?.payload?.toString()};
          }

        });
      });
    });
  }

  togglePower(deviceId: number) {
    this.apiService.controlDevice(deviceId, 'TOGGLE').subscribe();
  }
}