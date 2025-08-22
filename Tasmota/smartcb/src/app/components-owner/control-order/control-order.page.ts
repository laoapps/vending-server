import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { MqttClientService } from 'src/app/services/mqttClient.service';
import { PhotoProductService } from 'src/app/services/photo/photo-product.service';
import { DetailControlOrderPage } from './detail-control-order/detail-control-order.page';

@Component({
  selector: 'app-control-order',
  templateUrl: './control-order.page.html',
  styleUrls: ['./control-order.page.scss'],
  standalone: false,
})
export class ControlOrderPage implements OnInit {
  devices: any[] = [];
  public image = '../../../assets/icon/image.png';

  constructor(
    public m: LoadingService,
    public apiService: ApiService,
    private mqttService: MqttClientService,
    public alertController: AlertController,
    public caching: PhotoProductService
  ) {}

  ngOnInit() {
    this.load_data();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
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
        if (this.devices?.length) {
          for (let i = 0; i < this.devices.length; i++) {
            const e = this.devices[i];
            for (let j = 0; j < e.description?.image.length; j++) {
              const v = e.description?.image[j];
              const aa = await this.caching.saveCachingPhoto(
                v,
                new Date(e.updatedAt),
                e.id + ''
              );
              if (e?.pic?.length > 0) {
                e.pic.push(
                  JSON.parse(aa).v.replace(
                    'data:application/octet-stream',
                    'data:image/jpeg'
                  )
                );
              } else {
                e['pic'] = [
                  JSON.parse(aa).v.replace(
                    'data:application/octet-stream',
                    'data:image/jpeg'
                  ),
                ];
              }
            }
          }
        }
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

  setControlDevice(item) {
    this.m.showModal(DetailControlOrderPage, { data:item }).then((r) => {
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

  return_pic(item) {
    if (item.pic?.length) {
      return item?.pic[0];
    } else {
      return this.image;
    }
  }
}
