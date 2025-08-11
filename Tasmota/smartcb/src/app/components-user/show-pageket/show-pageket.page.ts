import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { PayQrPage } from '../pay-qr/pay-qr.page';

@Component({
  selector: 'app-show-pageket',
  templateUrl: './show-pageket.page.html',
  styleUrls: ['./show-pageket.page.scss'],
  standalone: false,

})
export class ShowPageketPage implements OnInit {
  schedulePackages: any[] = [];
  @Input() data:any
  @Input() deviceID:any
  @Input() data_device:any
  constructor(public m: LoadingService, private apiService: ApiService,
    public alertController: AlertController
  ) {}

  ngOnInit() {
    this.load_data();
  }

  load_data(){
    this.apiService.schedulepackages(this.data?.ownerID).subscribe((packages) => {
      this.schedulePackages = packages;
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick(item){
    let data = {
      packageId:item.id,
      deviceId:this.deviceID,
      relay:1
    }
    this.apiService.orders(data).subscribe((r)=>{
      console.log('====================================');
      console.log('res',r);
      console.log('====================================');
      this.m.showModal(PayQrPage,{data:r?.qr.data,data_device:this.data_device,data_pageket:item}).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    },(error)=>{
      console.log('====================================');
      console.log('error',error);
      console.log('====================================');
    })
  }

}
