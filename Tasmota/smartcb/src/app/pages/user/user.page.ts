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
    {title:'Scan QR Code',icon: 'qr-code-outline'}
  ]
  constructor(public m: LoadingService,public router:Router,public alertController:AlertController) {}

  ngOnInit() {
  }

  async logout(){
    const alert = await this.alertController.create({
      header: 'Confirm logout',
      message: 'Are you sure you want logout?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'ok',
          handler: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('uuid');
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }

  onClick(item){
    if (item.title == 'Scan QR Code') {
      BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] })
      .then(async (barcodeData) => {
        if (barcodeData.barcodes) {
          // this.load.alertError(`Formar: ${barcodeData.barcodes[0].rawValue}`);
          this.getResultscan(barcodeData.barcodes[0].rawValue);
        } else {
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Error Qr not found!!',
            buttons: ['OK'],
          });
          await alert.present();
          return;
        }
      })
      .catch((err) => {
        console.log("Error", err);
      });
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

  getResultscan(data){
    this.m.showModal(ShowDevicesPage,{data:JSON.parse(data)}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
          }
        });
      }
    });
  }

}
