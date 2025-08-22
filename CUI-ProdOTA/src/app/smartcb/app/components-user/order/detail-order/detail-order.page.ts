import { Component, Input, OnInit } from '@angular/core';
import { LoadingService } from '../../../services/loading.service';
import { PhotoProductService } from '../../../services/photo/photo-product.service';
import { MqttClientService } from '../../../services/mqttClient.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-detail-order',
  templateUrl: './detail-order.page.html',
  styleUrls: ['./detail-order.page.scss'],
  standalone: false,
})
export class DetailOrderPage implements OnInit {
  @Input() data:any
  schedulePackages: any[] = [];
  devices: any[] = [];
  public image = '../../../assets/icon/image.png'


  constructor(public apiService: ApiService, public m: LoadingService,
    public caching:PhotoProductService,    private mqttService: MqttClientService,
  ) {}


  ngOnInit() {
    console.log('====================================');
    console.log(this.data);
    console.log('====================================');
    this.load_package();
  }

  load_package(){
    this.m.onLoading('')
    let data = {
      packages:[this.data?.packageId]
    }
    console.log('data',data);

    this.apiService.findByPackageIDs(data).subscribe(async (packages) => {
      // this.m.onDismiss();
      console.log('====================================');
      console.log('package',packages);
      console.log('====================================');
      this.schedulePackages = packages;
      this.load_data_devices();
      if (this.schedulePackages?.length ) {
        for (let i = 0; i < this.schedulePackages.length; i++) {
          const e = this.schedulePackages[i];
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
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load pageket fail!!')
    });
  }

  load_data_devices(){
    let data = {
      ownerId:Number(this.schedulePackages[0]?.ownerId+''),
      id:this.data?.deviceId
    }
    this.apiService.getDevicesBy(data).subscribe(async (r)=>{
      console.log('====================================');
      console.log(r);
      console.log('====================================');
      this.m.onDismiss();
      this.devices = r
      console.log('====================================');
      console.log(this.devices[0]?.tasmotaId);
      console.log('====================================');
      // this.mqttService.subscribeToDevice(this.devices[0]?.tasmotaId).subscribe((message) => {
      //   try {
      //     console.log('====================================');
      //     console.log('message',message)
      //     console.log(message.payload.toString());
      //     console.log('====================================');
      //     this.devices[0].status = JSON.parse(message.payload.toString());
      //   } catch (error) {
      //     console.log(`Failed to parse message for device ${this.devices[0].tasmotaId}:`, error);
      //     this.devices[0].status = message.payload.toString();
      //   }
      // });
      // this.mqttService.subscribeToTelemetry(this.devices[0]?.tasmotaId).subscribe((message) => {
      //   console.log(`Received telemetry for device ${this.devices[0].tasmotaId}:`, message);
      //   try {
      //     const data = JSON.parse(message.payload.toString());
      //     console.log(`Parsed telemetry data for device ${this.devices[0].tasmotaId}:`, data);
      //     this.devices[0].power = data?.ENERGY?.Power || 0;
      //     this.devices[0].energy = (data?.ENERGY?.Total || 0) + 10;
      //     this.devices[0].Temperature = (data?.ANALOG?.Temperature1 || 0) + ' ' + data?.TempUnit;
      //   } catch (error) {
      //     console.log(`Failed to parse telemetry data for device ${this.devices[0].tasmotaId}:`, error);
      //     this.devices[0].status = message.payload.toString();
      //   }
      // });


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
    },(error)=>{
      this.m.onDismiss();
      this.m.alertError('load devices fail!!')
    })
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }
  
  return_pic(item){
    if (item[0].pic?.length) {
      return item[0]?.pic[0]
    }else{
      return this.image
    }
  }

}
