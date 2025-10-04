import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { PhotoProductService } from '../../../services/photo/photo-product.service';
import { ApiVendingService } from '../../../services/api-for-vending/api-vending.service';

@Component({
  selector: 'app-detail-history',
  templateUrl: './detail-history.page.html',
  styleUrls: ['./detail-history.page.scss'],
  standalone: false,

})
export class DetailHistoryPage implements OnInit {
  @Input() data:any
  schedulePackages: any[] = [];
  devices: any[] = [];
  public image = '../../../../../../assets/icon-smartcb/image.png'


  constructor(public apiService: ApiService,
     public m: LoadingService,
     public ApiVending:ApiVendingService,
    public caching:PhotoProductService
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

    this.ApiVending.findByPackageIDs(data).subscribe(async (packages) => {
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
