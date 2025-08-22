import { Component, OnInit } from '@angular/core';
import { AddDevicesPage } from './add-devices/add-devices.page';
import { AlertController } from '@ionic/angular';
import { ControlDevicePage } from './control-device/control-device.page';
import { MqttClientService } from '../../services/mqttClient.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: false,
})
export class DevicesPage implements OnInit {
  devices: any[] = [];
  controlDevice = { id: -1, command: 'TOGGLE', relay: 1 }; // New state for device control
  public image = '../../../assets/icon/image.png'

  constructor(
    public m: LoadingService,
    public apiService: ApiService,
    private mqttService: MqttClientService,
    public alertController: AlertController,
    public caching:PhotoProductService
    
  ) {}

  ngOnInit() {
    this.load_data();
  }

  load_data() {
    this.m.onLoading('');
    this.apiService.getDevices().subscribe(
      async (devices) => {
        console.log('====================================');
        console.log(devices);
        console.log('====================================');
        this.m.onDismiss();
        this.devices = devices;
        if (this.devices?.length ) {
          for (let i = 0; i < this.devices.length; i++) {
            const e = this.devices[i];
            for (let j = 0; j < e.description?.image.length; j++) {
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
        this.devices.forEach((device) => {
          this.mqttService
            .subscribeToDevice(device.tasmotaId)
            .subscribe((message) => {
              console.log('====================================');
              console.log('message',message);
              console.log('====================================');
              try {
                device.status = JSON.parse(message.payload.toString());
                console.log('====================================');
                console.log(message.payload.toString());
                console.log('====================================');
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

  onClick_add() {
    this.m.showModal(AddDevicesPage,{title:'add'}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.devices = [];
            this.load_data();
          }
        });
      }
    });
  }

  setControlDevice(deviceId: number) {
    // this.controlDevice = { id: deviceId, command: 'TOGGLE', relay: 1 }; // Reset control device state
    console.log(`Setting control device with ID: ${deviceId}`);
    this.m.showModal(ControlDevicePage, { data: deviceId }).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.devices = [];
            this.load_data();
          }
        });
      }
    });
  }

  updateDevice(device: any) {
    this.m
      .showModal(AddDevicesPage, { data: device, title: 'edit' })
      .then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
              this.devices = [];
              this.load_data();
            }
          });
        }
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
            this.apiService.deleteDevice(id).subscribe(
              () => {
                this.devices = [];
                this.load_data();
              },
              (error) => {
                this.m.alertError('Delete Device fail!!');
              }
            );
          },
        },
      ],
    });
    await alert.present();
  }

  return_pic(item){
    if (item.pic?.length) {
      return item?.pic[0]
    }else{
      return this.image
    }
  }
}
