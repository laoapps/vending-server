import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';
import { OrderPage } from '../../components-user/order/order.page';
import { MapPage } from '../../components-user/map/map.page';
import { ShowPageketPage } from '../../components-user/show-pageket/show-pageket.page';
import { ShowDevicesPage } from '../../components-user/show-devices/show-devices.page';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: false,

})
export class UserPage implements OnInit {
  public menus = [
    {title:'Order',icon: 'time-outline',path:OrderPage},
    // {title:'Status',icon: 'information-circle-outline',path:StatusPage},
    {title:'Scan QR Code',icon: 'qr-code-outline'},
    {title:'Map',icon: 'map-outline',path:MapPage},
    // {title:'All groups',icon: 'receipt-outline',path:ListAllGroupsPage},
    {title:'Register owner',icon: 'albums-outline'},
  ]
  phonenumber:any
  constructor(public m: LoadingService,public router:Router,public alertController:AlertController,private apiService: ApiService) {}

  ngOnInit() {

  }

  ionViewWillEnter() {
    const a = localStorage.getItem("phonenumber");
      if (a) {
        this.phonenumber = a.replace("+85620", "").replace(/(\d[ .-]?){6}$/, x => x.replace(/\d/g, 'x').substring(2, a.length)) + a.replace("+85620", "").substring(6, a.length)
      } else {
        this.m.alertError('alert_error.message_something_wrong');
      }
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
          if (error?.error?.error == 'Owner already registered') {
            this.m.onAlert('Already registered!!')
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
  //     ownerId:1
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
    if (new_data?.ownerId && new_data?.deviceId) {
      this.m.showModal(ShowPageketPage,{data:new_data,deviceId:new_data?.deviceId}).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }else if(new_data?.ownerId && !new_data?.deviceId || new_data?.deviceId == null){
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
