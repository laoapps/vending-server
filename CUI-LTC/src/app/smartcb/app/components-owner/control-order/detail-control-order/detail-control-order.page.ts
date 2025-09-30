import { Component, Input, OnInit } from '@angular/core';
import { ControlDevicePage } from '../../devices/control-device/control-device.page';
import { LoadingService } from '../../../services/loading.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-detail-control-order',
  templateUrl: './detail-control-order.page.html',
  styleUrls: ['./detail-control-order.page.scss'],
  standalone: false,

})
export class DetailControlOrderPage implements OnInit {
  @Input() data:any
  order: any[] = []
  constructor(
    public m: LoadingService,
    public apiService: ApiService,
  ) { }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  ngOnInit() {
    console.log('====================================');
    console.log(this.data);
    console.log('====================================');
    this.load_data();
  }

  load_data() {
    this.m.onLoading('');
    this.apiService.getActiveOrdersByDeviceID(this.data).subscribe(
      async (order) => {
        console.log('====================================');
        console.log('order loaded:', order);
        console.log('====================================');
        this.order = order;
        // if (this.groups?.length ) {
        //   for (let i = 0; i < this.groups.length; i++) {
        //     const e = this.groups[i];
        //     for (let j = 0; j < e.description?.image?.length; j++) {
        //       const v = e.description?.image[j];
        //       const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
        //       if (e?.pic?.length > 0) {
        //         e.pic.push(JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg'))
        //       }else{
        //         e['pic'] = [JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg')]
        //       }
        //     }
        //   }
        // }
        this.m.onDismiss();
      },
      (error) => {
        this.m.onDismiss();
        this.m.alertError('load order fail!!');
      }
    );
  }

  onClick_control(deviceId:number){
    this.m.showModal(ControlDevicePage, { data: deviceId }).then((r) => {
          if (r) {
            r.present();
            r.onDidDismiss().then((res) => {
              if (res.data.dismiss) {
                // this.devices = [];
                this.load_data();
              }
            });
          }
        });

  }

}
