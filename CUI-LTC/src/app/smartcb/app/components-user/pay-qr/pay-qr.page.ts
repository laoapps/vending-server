import { Component, Input, OnInit } from '@angular/core';
import QrCodeWithLogo from 'qrcode-with-logos';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';

@Component({
  selector: 'app-pay-qr',
  templateUrl: './pay-qr.page.html',
  styleUrls: ['./pay-qr.page.scss'],
  standalone: false,

})
export class PayQrPage implements OnInit {
  public qrcode_logo:any
  private intervalId: any;
  private totalSeconds = 5 * 60; // 1 minutes
  private totalSeconds_expired = 5 * 60; // 1 minutes
  currentColor: string = 'color-red';
  private colorInterval: any;
  countdown: string = '';
  public pic_device = '../../../../../assets/icon-smartcb/laoqr.png'
  @Input() data_device:any
  @Input() data_pageket:any

  info_qr_code:any
  parseGetTotalSale: any = {} as any;
  drawCircle: Array<any> = [];
  isPayment: boolean = false;
  countdownDestroy: number = 60;
  countdownDestroyTimer: any = {} as any;
  cashesList: Array<any> = [
    // {
    //   image: `../../../../assets/logo/LAAB-logo.png`,
    //   name: 'LAAB',
    //   title: 'LAAB Wallet / Cash (optional)',
    //   detail: 'Pay your order by using LAAB',
    //   value: 'laab'
    // },
  ]

  bankList: Array<any> = [
    {
      image: `../../../../assets/logo/laoqr.png`,
      name: 'Lao QR',
      title: 'Lao QR (optional)',
      detail: 'Pay your orders by using Lao QR One QRCode',
      value: 'LaoQR'
    }
  ]
  paymentList: Array<any> = [...this.cashesList, ...this.bankList];

  constructor(public apiService: ApiService, public m: LoadingService,    public ApiVending: ApiVendingService
  ) {}

  ngOnInit() {
    console.log('====================================');
    console.log(this.data_device);
    console.log('====================================');
    this.load_qr();
  }

  ngOnDestroy(): void {

    // intervals
    // clearInterval(this.reloadElement);
    // clearInterval(this.countdownBillTimer);
    // clearInterval(this.countdownPaymentTimer);
    // clearInterval(this.reloadMessageElement);
    // clearInterval(this.countdownCheckLAABTimer);
    clearInterval(this.countdownDestroyTimer);
    // clearInterval(this.countdownLAABDestroyTimer);
    // clearInterval(this.countdownCheckLaoQRPaidTimer);
    // if (this.WSAPIService.waitingDelivery) this.WSAPIService.waitingDelivery.unsubscribe();

  }

  load_qr(){
    let data = {
      packageId:this.data_pageket?.id,
      deviceId:this.data_device?.id,
      relay:1
    }
    console.log('====================================');
    console.log('data sent',data);
    console.log('====================================');
    this.ApiVending.orders(data).subscribe((r)=>{
      console.log('====================================');
      console.log('res',r);
      console.log('====================================');
      this.info_qr_code = r.qr?.data
      this.genQrcode();
    },(error)=>{
      if (error?.error?.error == 'device still using!') {
        this.m.alert_justOK("Device still using").then(r=>{
          if (r) {
            this.m.closeModal({ dismiss: true });
          }
        })
      }else{
        this.m.alertError("Generate QR fail!!")
      }
    })
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  genQrcode(){
    // this.load.onLoading('')
      let qrcode = new QrCodeWithLogo({
        content: this.info_qr_code.emv,
        width: 250,
        logo: {
          src: this.pic_device,
          logoRadius: 10, // Optional: adjust for rounded corners
          borderRadius: 5, // Optional: adjust for border
          borderColor: "#ff00000", // Optional: white border
          borderWidth: 3, // Optional: border width
          bgColor: "#ffffff", // Optional: background color
          crossOrigin: "Anonymous", // Optional: for CORS
        }
      });
      qrcode.getCanvas().then(canvas => {
        // this.load.onDismiss()
        this.qrcode_logo = canvas.toDataURL()
        // or do other things with image
        this.isPayment = true;
               this.countdownDestroyTimer = setInterval(async () => {
                    this.countdownDestroy--;
                    if (this.countdownDestroy <= 0) {
                      clearInterval(this.countdownDestroyTimer);
                      this.countdownDestroy = 60;
                      this.m.alert_justOK('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321').then(r=>{
                        if (r) {
                            this.close();
                        }
                      });
                    }
                  }, 1000);
      }).catch(e => {
        console.log(e);
      })
  }

  close(){
    clearInterval(this.countdownDestroyTimer);
    this.m.closeModal({dismiss:true});
  }
  

  startCountdown() {
    this.updateDisplay();
    this.intervalId = setInterval(() => {
      this.totalSeconds--;
      this.updateDisplay();

      if (this.totalSeconds <= 0) {
        clearInterval(this.intervalId);
        clearInterval(this.colorInterval);
        this.countdown = 'ໝົດເວລາ!';
      }
    }, 1000);
  }

  startColorChange() {
    const colors = ['color-black','color-red'];
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

}
