import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { PayQrPage } from '../pay-qr/pay-qr.page';
import { LoadingService } from 'src/app/loading.service';

@Component({
  selector: 'app-show-pageket',
  templateUrl: './show-pageket.page.html',
  styleUrls: ['./show-pageket.page.scss'],
  standalone: false,

})
export class ShowPageketPage implements OnInit {
  schedulePackages: any[] = [];
  @Input() data: any
  @Input() deviceId: any
  @Input() data_device: any
  constructor(public m: LoadingService, private apiService: ApiService,
    public alertController: AlertController
  ) { }

  ngOnInit() {
    this.load_data();
  }

  load_data() {
    this.m.onLoading('')
    this.apiService.schedulepackages(this.data?.ownerId).subscribe((packages) => {
      this.m.onDismiss();
      this.schedulePackages = packages;
    }, error => {
      this.m.onDismiss();
      this.m.alertError('load pageket fail!!')
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick(item) {
    let data = {
      packageId: item.id,
      deviceId: this.deviceId,
      relay: 1
    }
    this.apiService.orders(data).subscribe((r) => {
      console.log('====================================');
      console.log('res', r);
      console.log('====================================');
      this.m.showModal(PayQrPage, { data: r?.qr.data, data_device: this.data_device | this.deviceId, data_pageket: item }).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }, (error) => {
      console.log('====================================');
      console.log('error', error);
      console.log('====================================');
    })
  }

}
