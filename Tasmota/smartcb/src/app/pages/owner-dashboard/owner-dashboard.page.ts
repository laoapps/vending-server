import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqttClient.service';

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
  newDevice = { name: '', tasmotaId: '', zone: '' };
  newGroup = { name: '' };
  newSchedule = { deviceId: null, type: 'timer', cron: '', command: '', conditionType: '', conditionValue: null };
  assignDevice = { groupId: null, deviceId: null };
  assignUser = { deviceId: null, userPhoneNumber: '' };

  constructor(private apiService: ApiService, private mqttService: MqttClientService) {}

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
  }

  addDevice() {
    this.apiService.createDevice(this.newDevice.name, this.newDevice.tasmotaId, this.newDevice.zone).subscribe(() => {
      this.loadData();
      this.newDevice = { name: '', tasmotaId: '', zone: '' };
    });
  }

  updateDevice(device: any) {
    this.apiService.updateDevice(device.id, device.name, device.tasmotaId, device.zone, device.groupId).subscribe(() => {
      this.loadData();
    });
  }

  deleteDevice(id: number) {
    this.apiService.deleteDevice(id).subscribe(() => {
      this.loadData();
    });
  }

  togglePower(deviceId: number) {
    this.apiService.controlDevice(deviceId, 'POWER TOGGLE').subscribe();
  }

  addGroup() {
    this.apiService.createGroup(this.newGroup.name).subscribe(() => {
      this.loadData();
      this.newGroup = { name: '' };
    });
  }

  updateGroup(group: any) {
    this.apiService.updateGroup(group.id, group.name).subscribe(() => {
      this.loadData();
    });
  }

  deleteGroup(id: number) {
    this.apiService.deleteGroup(id).subscribe(() => {
      this.loadData();
    });
  }

  assignDeviceToGroup() {
    if (this.assignDevice.groupId && this.assignDevice.deviceId) {
      this.apiService.assignDeviceToGroup(this.assignDevice.groupId, this.assignDevice.deviceId).subscribe(() => {
        this.loadData();
        this.assignDevice = { groupId: null, deviceId: null };
      });
    }
  }

  addSchedule() {
    if (this.newSchedule.deviceId) {
      this.apiService.createSchedule(
        this.newSchedule.deviceId,
        this.newSchedule.type,
        this.newSchedule.cron,
        this.newSchedule.command,
        this.newSchedule.conditionType,
        this.newSchedule.conditionValue||undefined
      ).subscribe(() => {
        this.loadData();
        this.newSchedule = { deviceId: null, type: 'timer', cron: '', command: '', conditionType: '', conditionValue: null };
      });
    }
  }

  updateSchedule(schedule: any) {
    this.apiService.updateSchedule(
      schedule.id,
      schedule.type,
      schedule.cron,
      schedule.command,
      schedule.conditionType,
      schedule.conditionValue,
      schedule.active
    ).subscribe(() => {
      this.loadData();
    });
  }

  deleteSchedule(id: number) {
    this.apiService.deleteSchedule(id).subscribe(() => {
      this.loadData();
    });
  }

  assignDeviceToUser() {
    if (this.assignUser.deviceId && this.assignUser.userPhoneNumber) {
      this.apiService.assignDevice(this.assignUser.deviceId, this.assignUser.userPhoneNumber).subscribe(() => {
        this.loadData();
        this.assignUser = { deviceId: null, userPhoneNumber: '' };
      });
    }
  }
}