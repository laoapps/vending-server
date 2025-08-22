import { Component, OnInit } from '@angular/core';
import { AddGroupsPage } from './add-groups/add-groups.page';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';
import { MqttClientService } from '../../services/mqttClient.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
  standalone: false,
})
export class GroupsPage implements OnInit {
  groups: any[] = [];
  devices: any[] = [];
  public page = 1;
  assignDevice = { groupId: -1, deviceId: -1 };
  public image = '../../../assets/icon/image.png'
  constructor(
    public m: LoadingService,
    public apiService: ApiService,
    private mqttService: MqttClientService,
    public caching:PhotoProductService
    
  ) {}

  ngOnInit() {
    this.load_data();
    this.load_devices();
  }

  load_data() {
    this.m.onLoading('');
    this.apiService.getGroups().subscribe(
      async (groups) => {
        console.log('====================================');
        console.log('Groups loaded:', groups);
        console.log('====================================');
        this.groups = groups;
        if (this.groups?.length ) {
          for (let i = 0; i < this.groups.length; i++) {
            const e = this.groups[i];
            for (let j = 0; j < e.description?.image?.length; j++) {
              const v = e.description?.image[j];
              const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
              if (e?.pic?.length > 0) {
                e.pic.push(JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg'))
              }else{
                e['pic'] = [JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg')]
              }
            }
          }
        }
        this.m.onDismiss();
      },
      (error) => {
        this.m.onDismiss();
        this.m.alertError('load Groups fail!!');
      }
    );
  }



  load_devices() {
    // this.m.onLoading('');
    this.apiService.getDevices().subscribe(
      (devices) => {
        console.log('====================================');
        console.log(devices);
        console.log('====================================');
        this.m.onDismiss();
        this.devices = devices;
        this.devices.forEach((device) => {
          this.mqttService
            .subscribeToDevice(device.tasmotaId)
            .subscribe((message) => {
              try {
                device.status = JSON.parse(message.payload.toString());
              } catch (error) {
                this.m.onDismiss();
                // this.m.onAlert('Failed to parse message for device!!');
                device.status = message.payload.toString();
              }
            });
          this.mqttService
            .subscribeToTelemetry(device.tasmotaId)
            .subscribe((message) => {
              console.log(
                `Received telemetry for device ${device.tasmotaId}:`,
                message
              );
              try {
                const data = JSON.parse(message.payload.toString());
                console.log(
                  `Parsed telemetry data for device ${device.tasmotaId}:`,
                  data
                );
                device.power = data?.ENERGY?.Power || 0;
                device.energy = data?.ENERGY?.Total || 0;
                device.Temperature =
                  (data?.ANALOG?.Temperature1 || 0) + ' ' + data?.TempUnit;
              } catch (error) {
                this.m.onDismiss();
                // this.m.onAlert('Failed to parse telemetry data!!');
                device.status = message.payload.toString();
              }
            });
        });
      },
      (error) => {}
    );
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  EditSchedulePackage(item){
    this.m.showModal(AddGroupsPage,{title:'edit',data:item}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.groups = [];
            this.load_data();
          }
        });
      }
    });
  }

  deleteSchedulePackage(id: number) {

  }
 

  onClick_add() {
    this.m.showModal(AddGroupsPage,{title:'add'}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.groups = [];
            this.load_data();
          }
        });
      }
    });
  }

  return_pic(item){
    if (item.pic?.length) {
      return item?.pic[0]
    }else{
      return this.image
    }
  }
}
