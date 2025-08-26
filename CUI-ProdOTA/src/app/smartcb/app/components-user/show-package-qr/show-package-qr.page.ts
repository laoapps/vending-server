import { Component, Input, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';
import { AlertController } from '@ionic/angular';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';
import { PayQrPage } from '../pay-qr/pay-qr.page';
import QrCodeWithLogo from 'qrcode-with-logos';
@Component({
  selector: 'app-show-package-qr',
  templateUrl: './show-package-qr.page.html',
  styleUrls: ['./show-package-qr.page.scss'],
})
export class ShowPackageQrPage implements OnInit {

 schedulePackages: any[] = [];
  @Input() data:any
  @Input() deviceId:any
  @Input() data_device:any
  public image = '../../../../../assets/icon-smartcb/pricing.png'
    public pic_device = '../../../../../assets/icon-smartcb/laoqr.png'
    public qrcode_logo:any
    static laabCardFooter: HTMLDivElement;


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

  constructor(public m: LoadingService, private apiService: ApiService,
    public alertController: AlertController,public caching:PhotoProductService,
    public ApiVending: ApiVendingService
  ) {}

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

  ngOnInit() {
    console.log('====================================');
    console.log(this.data);
    console.log('====================================');
    this.load_data();
  }

  load_data(){
    this.m.onLoading('')
    let data = {
      packages:this.data?.description?.packages
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

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick(item){
      let data = {
        packageId:item.id,
        deviceId:this.deviceId,
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
        console.log('====================================');
        console.log('error',error);
        console.log('====================================');
      })
      ShowPackageQrPage.laabCardFooter = (document.querySelector('.laab-card-footer') as HTMLDivElement);

    // this.m.showModal(PayQrPage,{data:item,data_device:this.data_device | this.deviceId,data_pageket:item},'dialog-fullscreen').then((r) => {
    //   if (r) {
    //     r.present();
    //     r.onDidDismiss().then((res) => {
    //       if (res.data.dismiss) {
    //       }
    //     });
    //   }
    // });
  }

  return_pic(item){
    if (item.pic?.length) {
      return item?.pic[0]
    }else{
      return this.image
    }
  }

  private loadBillWave() {
    this.drawCircle = [];
    for (let i = 0; i < 50; i++) {
      const elm = document.createElement('div');
      elm.className = 'shape';
      this.drawCircle.push(elm);
    }
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
    this.dismiss(false);
  }

}
