import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { AddGroupsPage } from './add-groups/add-groups.page';
import { MqttClientService } from 'src/app/services/mqttClient.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
  standalone: false,
})
export class GroupsPage implements OnInit {
  groups: any[] = [];
  devices: any[] = [];
  public page = 1
  assignDevice = { groupId: -1, deviceId: -1 };


  constructor(public m: LoadingService,public apiService:ApiService,
    private mqttService: MqttClientService,
  ) {}

  ngOnInit() {
    this.load_data();
    this.load_devices();
  }

  load_data() {
    this.apiService.getGroups().subscribe((groups) => {
      console.log('====================================');
      console.log('Groups loaded:', groups);
      console.log('====================================');
      this.groups = groups;
    });
  }

  load_devices(){
         this.apiService.getDevices().subscribe((devices) => {
      console.log('====================================');
      console.log(devices);
      console.log('====================================');
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
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  deleteSchedulePackage(id: number) {}

  assignDeviceToGroup(item){
    console.log('====================================');
    console.log('Assigning device to group:', item);
    console.log('====================================');
    const a = JSON.parse(JSON.stringify(this.devices))
    const b = a.filter((d) => d.groupId == item.id)
    this.page = 2
  }

  onClick_add(){
    this.m.showModal(AddGroupsPage).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.groups = []
            this.load_data();
          }
        });
      }
    });
  }
}
