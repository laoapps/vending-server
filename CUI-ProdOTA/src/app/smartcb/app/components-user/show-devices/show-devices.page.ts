import { Component, Input, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { ShowPageketPage } from '../show-pageket/show-pageket.page';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { ApiService } from '../../services/api.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';

@Component({
  selector: 'app-show-devices',
  templateUrl: './show-devices.page.html',
  styleUrls: ['./show-devices.page.scss'],
  standalone: false,

})
export class ShowDevicesPage implements OnInit {
  @Input() data:any
  devices: any[] = [];
  public image = '../../../assets/icon/image.png'

  constructor(public apiService: ApiService, public m: LoadingService,
      public caching:PhotoProductService,public ApiVending:ApiVendingService
    
  ) {}

  ngOnInit() {
    this.load_data();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  load_data(){
    this.m.onLoading('')
    let data = {
      ownerId:Number(this.data?.ownerId+''),
      id:this.data?.deviceId
    }
    this.ApiVending.getDevicesBy(data).subscribe(async (r)=>{
      console.log('====================================');
      console.log(r);
      console.log('====================================');
      this.m.onDismiss();
      this.devices = r
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

  onClick_devices(item){
    console.log('====================================');
    console.log(item);
    console.log('====================================');
    this.m.showModal(ShowPageketPage,{data:this.data,deviceId:item.id,data_device:item}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
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
