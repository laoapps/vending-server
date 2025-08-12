import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { HistoryPage } from 'src/app/components-user/history/history.page';
import { StatusPage } from 'src/app/components-user/status/status.page';
import { LoadingService } from 'src/app/services/loading.service';
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';
import { ShowDevicesPage } from 'src/app/components-user/show-devices/show-devices.page';
import { ShowPageketPage } from 'src/app/components-user/show-pageket/show-pageket.page';
import { MapPage } from 'src/app/components-user/map/map.page';
import { ApiService } from 'src/app/services/api.service';
@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: false,

})
export class UserPage implements OnInit {
  public menus = [
    {title:'Histoy',icon: 'time-outline',path:HistoryPage},
    {title:'Status',icon: 'information-circle-outline',path:StatusPage},
    {title:'Scan QR Code',icon: 'qr-code-outline'},
    {title:'Map',icon: 'map-outline',path:MapPage},
    {title:'Register owner',icon: 'albums-outline'},
  ]
  constructor(public m: LoadingService,public router:Router,public alertController:AlertController,private apiService: ApiService) {}

  ngOnInit() {
  }

  logout(){
    this.m.logout();
  }

  onClick(item){
    if (item.title == 'Scan QR Code') {
      BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] })
      .then(async (barcodeData) => {
        if (barcodeData.barcodes) {
          this.getResultscan(barcodeData.barcodes[0].rawValue);
        } else {
          this.m.alertError('Error Qr not found!!')
        }
      })
      .catch((err) => {
        this.m.alertError('Error Qr not found!!')
      });
    }else if(item.title == 'Register owner'){
      const a = localStorage.getItem('token')
      this.apiService.registerOwner(a).subscribe(
        async (response) => {
          console.log('====================================');
          console.log(response);
          console.log('====================================');
          if (response) {
            this.m.onAlert('Register owner success!!')
          }
        },(error) => {
          if (error?.error == 'Owner already registered') {
            this.m.onAlert('already registered!!')
          }else{
            this.m.alertError('Register failed')
          }
        }
      );
    }else{
      this.m.showModal(item.path).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }
  //   let data = {
  //     ownerID:1
  //   }
  //   this.m.showModal(ShowDevicesPage,{data}).then((r) => {
  //     if (r) {
  //       r.present();
  //       r.onDidDismiss().then((res) => {
  //         if (res.data.dismiss) {
  //         }
  //       });
  //     }
  //   });
  }

  async getResultscan(data){
    const new_data = JSON.parse(data)
    if (new_data?.ownerID && new_data?.deviceID) {
      this.m.showModal(ShowPageketPage,{data:new_data,deviceID:new_data?.deviceID}).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }else if(new_data?.ownerID && !new_data?.deviceID || new_data?.deviceID == null){
      this.m.showModal(ShowDevicesPage,{data:JSON.parse(data)}).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }else{
      this.m.alertError('Error Qr not found!!')
    }
  }

}
