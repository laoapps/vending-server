import { Component, Input, OnInit } from '@angular/core';
import QrCodeWithLogo from 'qrcode-with-logos';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-pay-qr',
  templateUrl: './pay-qr.page.html',
  styleUrls: ['./pay-qr.page.scss'],
  standalone: false,
})
export class PayQrPage implements OnInit {
  public qrcode_logo: any;
  private totalSeconds = 5 * 60; // 1 minutes
  currentColor: string = 'color-red';
  private colorInterval: any;
  countdown: string = '';
  public pic_device = '../../../assets/icon/laoqr.png';
  @Input() data: any;
  @Input() data_device: any;
  @Input() data_pageket: any;
  isPayment: boolean = false;
  countdownDestroy: number = 60;
  countdownDestroyTimer: any = {} as any;
  info_qr_code: any;

  constructor(public apiService: ApiService, public m: LoadingService) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.load_qr();
  }
  ngOnDestroy(): void {
    clearInterval(this.countdownDestroyTimer);
    clearInterval(this.colorInterval);
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async load_qr() {
    let data = {
      packageId: this.data.id,
      deviceId: this.data_device,
      relay: 1
    }
    console.log('====================================');
    console.log('data sent', data);
    console.log('====================================');
    this.apiService.orders(data).subscribe((r) => {
        console.log('====================================');
        console.log('res', r.qr?.data);
        console.log('====================================');
        this.info_qr_code = r.qr?.data;
        this.genQrcode();
      },(error) => {
        alert(JSON.stringify(error));
        console.log('====================================');
        console.log('error', error);
        console.log('====================================');
      }
    );
  }

  genQrcode() {
    // this.load.onLoading('')
    let qrcode = new QrCodeWithLogo({
      content: this.info_qr_code.emv,
      width: 250,
      logo: {
        src: this.pic_device,
        logoRadius: 10, // Optional: adjust for rounded corners
        borderRadius: 5, // Optional: adjust for border
        borderColor: '#ff00000', // Optional: white border
        borderWidth: 3, // Optional: border width
        bgColor: '#ffffff', // Optional: background color
        crossOrigin: 'Anonymous', // Optional: for CORS
      },
    });
    qrcode
      .getCanvas()
      .then((canvas) => {
        // this.load.onDismiss()
        this.qrcode_logo = canvas.toDataURL();
        this.isPayment = true;
        this.countdownDestroyTimer = setInterval(async () => {
          this.countdownDestroy--;
          this.startColorChange();
          if (this.countdownDestroy <= 0) {
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            this.m
              .alert_justOK(
                'ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321'
              )
              .then((r) => {
                if (r) {
                  this.close();
                }
              });
          }
        }, 1000);
        // or do other things with image
      })
      .catch((e) => {
        console.log(e);
      });
  }

  close() {
    clearInterval(this.countdownDestroyTimer);
    clearInterval(this.colorInterval);
    this.m.closeModal({ dismiss: true });
  }

  startColorChange() {
    const colors = ['color-black', 'color-red'];
    let index = 0;

    this.colorInterval = setInterval(() => {
      this.currentColor = colors[index];
      index = (index + 1) % colors.length;
    }, 1000);
  }

  updateDisplay() {
    const minutes = Math.floor(this.totalSeconds / 60);
    const seconds = this.totalSeconds % 60;
    this.countdown = `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(val: number): string {
    return val < 10 ? '0' + val : val.toString();
  }

  choosePaymentMethod(item) {}
}
