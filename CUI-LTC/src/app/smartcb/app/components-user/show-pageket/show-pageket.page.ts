import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LoadingService } from '../../services/loading.service';
import { PayQrPage } from '../pay-qr/pay-qr.page';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { ApiService } from '../../services/api.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';

@Component({
  selector: 'app-show-pageket',
  templateUrl: './show-pageket.page.html',
  styleUrls: ['./show-pageket.page.scss'],
  standalone: false,

})
export class ShowPageketPage implements OnInit {
  schedulePackages: any[] = [];
  @Input() group:any
  @Input() device:any
  public image = '../../../../../assets/icon-smartcb/pricing.png'

  constructor(public m: LoadingService, private apiService: ApiService,
    public alertController: AlertController,public caching:PhotoProductService,
    public ApiVending: ApiVendingService
  ) {}

  ngOnInit() {
    console.log('====================================');
    console.log(this.group);
    console.log('====================================');
    this.load_data();
  }

  ngOnDestroy() {
    this.m.closeModal({dismiss:true});
  }


  load_data(){
    this.m.onLoading('')
    let data = {
      packages:this.group?.description?.packages
    }
    console.log('data',data);

    this.ApiVending.findByPackageIDs(data).subscribe(async (packages) => {
      this.m.onDismiss();
      this.schedulePackages = packages;
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

  dismiss(data: any = { dismiss: true }) {
    this.m.closeModal(data);
  }

  onClick(item){
    this.m.showModal(PayQrPage,{data_device:this.device,data_pageket:item},'dialog-fullscreen').then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.dismiss(false)
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
