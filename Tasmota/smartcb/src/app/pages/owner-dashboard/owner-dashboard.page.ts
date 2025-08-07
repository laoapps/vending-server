
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqttClient.service';
import { AlertController } from '@ionic/angular';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './owner-dashboard.page.html',
  styleUrls: ['./owner-dashboard.page.scss'],
  standalone: false,
})
export class OwnerDashboardPage implements OnInit {
  selectedTab = 'packages';
  devices: any[] = [];
  groups: any[] = [];
  schedulePackages: any[] = [];
  newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1 };
  newGroup = { name: '' };
  newSchedulePackage = { name: '', price: 0, conditionType: 'time_duration', conditionValue: 0 };
  assignDevice = { groupId: -1, deviceId: -1 };
  controlDevice = { id: -1, command: 'TOGGLE', relay: 1 }; // New state for device control

  constructor(
    private apiService: ApiService,
    private mqttService: MqttClientService,
    private alertController: AlertController,
    public m: LoadingService
  ) { }
  dismiss(data: any = { dismiss: true }) {
    this.m.closeModal(data)
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getDevices().subscribe((devices) => {
      console.log('getDevices',devices);

      this.devices = devices;
      this.devices.forEach((device) => {
        this.mqttService.subscribeToDevice(device.tasmotaId).subscribe((message) => {
          try {
            device.status = JSON.parse(message.payload.toString());
          } catch (error) {
            console.log(`Failed to parse message for device ${device.tasmotaId}:`, error);
            device.status = message.payload.toString();
          }
        });
        this.mqttService.subscribeToTelemetry(device.tasmotaId).subscribe((message) => {
          console.log(`Received telemetry for device ${device.tasmotaId}:`, message);
          try {
            const data = JSON.parse(message.payload.toString());
            console.log(`Parsed telemetry data for device ${device.tasmotaId}:`, data);
            device.power = data?.ENERGY?.Power || 0;
            device.energy = data?.ENERGY?.Total || 0;
            device.Temperature = (data?.ANALOG?.Temperature1 || 0) + ' ' + data?.TempUnit;
          } catch (error) {
            console.log(`Failed to parse telemetry data for device ${device.tasmotaId}:`, error);
            device.status = message.payload.toString();
          }
        });
      });
    });
    this.apiService.getGroups().subscribe((groups) => {
      console.log('getGroups',groups);

      this.groups = groups;
    });
    this.apiService.getSchedulePackages().subscribe((packages) => {
      console.log('getSchedulePackages',packages);
      
      this.schedulePackages = packages;
    });
  }

  async addSchedulePackage() {
    if (!this.newSchedulePackage.name || this.newSchedulePackage.price <= 0 || this.newSchedulePackage.conditionValue <= 0) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please fill in all fields with valid values.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
    this.apiService
      // .createSchedulePackage(
      //   this.newSchedulePackage.name,
      //   this.newSchedulePackage.conditionType === 'time_duration' ? this.newSchedulePackage.conditionValue : undefined,
      //   this.newSchedulePackage.conditionType === 'energy_consumption' ? this.newSchedulePackage.conditionValue : undefined,
      //   this.newSchedulePackage.price
      // )
      .createSchedulePackage(
        this.newSchedulePackage.name,
        this.newSchedulePackage.price,
        this.newSchedulePackage.conditionType,
        this.newSchedulePackage.conditionValue,
      )
      .subscribe(
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
          },
        },
      ],
    });
    await alert.present();
  }

  addDevice() {
    if (!this.newDevice.name || !this.newDevice.tasmotaId || !this.newDevice.zone || !this.newDevice.groupId) {
      return alert('empty!!!')
    }
    this.apiService.createDevice(this.newDevice.name, this.newDevice.tasmotaId, this.newDevice.zone, this.newDevice.groupId).subscribe(() => {
      this.loadData();
      this.newDevice = { name: '', tasmotaId: '', zone: '', groupId: -1 };
    });
  }

  updateDevice(device: any) {
    this.apiService.updateDevice(device.id, device.name, device.tasmotaId, device.zone, device.groupId).subscribe(() => {
      this.loadData();
    });
  }

  async deleteDevice(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this Device?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.apiService.deleteDevice(id).subscribe(() => {
              this.loadData();
            },
              (error) => {
                console.error('Failed to delete Device:', error);
              });
          },
        },
      ],
    });
    await alert.present();

  }

  controlDeviceAction() {
    console.log('sksksksksk', this.controlDevice.id);

    if (this.controlDevice.id) {
      this.apiService.controlDevice(this.controlDevice.id, this.controlDevice.command, Number(this.controlDevice.relay)).subscribe(
        (response) => {
          console.log(`Controlled device ${this.controlDevice.id} with command ${this.controlDevice.command} on relay ${this.controlDevice.relay}`, response);
        },
        (error) => {
          console.error(`Failed to control device ${this.controlDevice.id}:`, error);
        }
      );
    }
  }

  setControlDevice(deviceId: number) {
    this.controlDevice = { id: deviceId, command: 'TOGGLE', relay: 1 }; // Reset control device state
    console.log(`Setting control device with ID: ${deviceId}`);
  }


  //==================== Group ==================
  addGroup() {
    if (!this.newGroup.name) {
      return alert('empty!!!')
    }
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
        this.assignDevice = { groupId: -1, deviceId: -1 };
      });
    }
  }
}
