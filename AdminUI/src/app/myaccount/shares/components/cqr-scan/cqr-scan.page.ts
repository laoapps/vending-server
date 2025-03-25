import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import * as QRScan from 'qr-scanner';
import { ApiService } from 'src/app/services/api.service';
import { CqrPaymentPage } from '../cqr-payment/cqr-payment.page';
import { ICurrentCard, IENMessage } from 'src/app/models/base.model';
import { HashVerifyPage } from '../hash-verify/hash-verify.page';

@Component({
  selector: 'app-cqr-scan',
  templateUrl: './cqr-scan.page.html',
  styleUrls: ['./cqr-scan.page.scss'],
})
export class CqrScanPage implements OnInit {

  type: string;
  mode: string;
  destination: string;
  amount: number;
  expire: string;
  options: any = {} as any;

  sender: string;
  receiver: string;
  qrcodemode: string = undefined;
  uuid: string;
  coinname: string;
  name: string;



  qrscanner: QRScan.default;

  hashM: string;
  info: string;

  constructor(
    private modal: ModalController,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.scanQRFromCamera();
    
  }

  close() {
    if (this.qrscanner.start) {
      this.qrscanner.stop();
    }
    this.modal.dismiss();
  }

  async scanQRFromCamera() {
    
    this.qrscanner = new QRScan.default(document.getElementById('videoQr') as HTMLVideoElement, async rx => {
      this.qrscanner.stop();
      console.log(`ni dey`, rx);
      try {
        let data = JSON.parse(rx);
        if (rx) {
          console.log(`scan found`, rx);
            this.hashM = data.hash;
            this.info = data.info;
            this.type = data.type;
            this.mode = data.mode;
            this.destination = data.destination;
            this.amount = data.amount;
            this.expire = data.expire;
            this.options = data.options;
            this.name = data.name;
            
            if (this.hashM != undefined && Object.entries(this.hashM).length > 0) {

              if (this.apiService.currentcard == ICurrentCard.merchantCoinCard) {
                this.sender = this.apiService.merchantCoinName;
              } else if (this.apiService.currentcard == ICurrentCard.vendingLimtierCoinCard) {
                this.sender = this.apiService.vendingLimiterCoinName;
              } else {
                this.resetScan(IENMessage.youHaveNoCardUsingNow);
                return;
              }

              const props = {
                sender: this.sender,
                hashM: this.hashM,
                info: this.info,
                verifymode: 'qr',
              }

              this.apiService.modal.create({ component: HashVerifyPage, componentProps: props }).then(r => {
                r.present();
                this.modal.dismiss();
              });

            } else {
              await this.verifyCoin();

              if (this.qrcodemode != 'coin') {
                this.resetScan('invalid QR Code');
              }
            }

        }
      } catch (error) {
        this.resetScan('invalid QR Code');
      }
      
    }, e => {
      console.log(e);
    });
    this.qrscanner.start();

  }

  resetScan(s: string) {
    this.apiService.toast.create({ message: s, duration: 2000 }).then(r => r.present());
    setTimeout(() => {
      this.qrscanner.start();
      return;
    }, 2000);
  }

  async verifyCoin() {
    
    if (this.type == 'CQR' && this.mode == 'COIN' && this.options != undefined && Object.entries(this.options).length == 2) {
      this.qrcodemode = 'coin';
      if (this.apiService.currentcard == ICurrentCard.merchantCoinCard) {
        this.sender = this.apiService.merchantUUID;
      } else if (this.apiService.currentcard == ICurrentCard.vendingLimtierCoinCard) {
        this.sender = this.apiService.vendingLimiterUUID;
      } else {
        this.resetScan(IENMessage.youHaveNoCardUsingNow);
        return;
      }
      this.receiver = this.destination;

      if (this.sender == this.receiver) {
        this.resetScan('you can not scan your own qr code');
        return;
      }

      const props = {
        type: this.type,
        mode: this.mode,
        sender: this.sender,
        receiver: this.receiver,
        amount: this.amount,
        expire: this.expire,
        options: {
          coinname: this.options.coinname,
          name: this.options.name,
        },
      }

      this.apiService.modal.create({ component: CqrPaymentPage, componentProps: props }).then(r => {
        r.present();
      });
      this.modal.dismiss();
      return;
    
    }
  }

  scanQRFromImage(files: FileList) {
    QRScan.default.scanImage(files[0]).then(async rx => {
      this.qrscanner.stop();
      try {
        let data = JSON.parse(rx);
        if (rx) {
            this.hashM = data.hash;
            this.info = data.info;
            this.type = data.type;
            this.mode = data.mode;
            this.destination = data.destination;
            this.amount = data.amount;
            this.expire = data.expire;
            this.options = data.options;
            this.name = data.name;
            
            if (this.hashM != undefined && Object.entries(this.hashM).length > 0) {

              if (this.apiService.currentcard == ICurrentCard.merchantCoinCard) {
                this.sender = this.apiService.merchantCoinName;
              } else if (this.apiService.currentcard == ICurrentCard.vendingLimtierCoinCard) {
                this.sender = this.apiService.vendingLimiterCoinName;
              } else {
                this.resetScan(IENMessage.youHaveNoCardUsingNow);
                return;
              }

              const props = {
                sender: this.sender,
                hashM: this.hashM,
                info: this.info,
                verifymode: 'qr',
              }

              this.apiService.modal.create({ component: HashVerifyPage, componentProps: props }).then(r => {
                r.present();
                this.modal.dismiss();
              });

            } else {
              await this.verifyCoin();

              if (this.qrcodemode != 'coin') {
                this.resetScan('invalid QR Code');
              }
            }
        }
      } catch (error) {
        this.resetScan('invalid QR Code');
      }

    });


  }
}
