import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import qrlogo from 'qrcode-with-logos';
import { IENMessage } from 'src/app/models/base.model';
import { ModalController } from '@ionic/angular';
import { IBillProcess } from 'src/app/services/syste.model';
import { RemainingbillsPage } from 'src/app/remainingbills/remainingbills.page';

@Component({
  selector: 'app-order-paid',
  templateUrl: './order-paid.page.html',
  styleUrls: ['./order-paid.page.scss'],
})
export class OrderPaidPage implements OnInit, OnDestroy {

  @Input() orders: Array<any>;
  @Input() getTotalSale: any;
  @Input() orderCartPage: any;
  @Input() qrcode: string;

  shapesObject: Array<any> = [];
  billdate: any = new Date();

  cashesTitle: string = 'Cashes';
  cashesList: Array<any> = [
    // {
    //   image: `../../../../assets/logo/LAAB-logo.png`,
    //   name: 'LAAB',
    //   title: 'LAAB Wallet / Cash (optional)',
    //   detail: 'Pay your order by using LAAB',
    //   value: 'laab'
    // },
  ]

  ewalletTitle: string = 'Wallets';
  ewalletList: Array<any> = [
    {
      image: `../../../../assets/logo/mmoney-logo.png`,
      name: 'MMoney',
      title: 'MMoney (optional)',
      detail: 'Pay your orders by using MMoney QRCode',
      value: 'mmoney'
    },
    // {
    //   image: `../../../../assets/logo/umoney-logo.png`,
    //   name: 'UMoney',
    //   title: 'UMoney (optional)',
    //   detail: 'Pay your orders by using UMoney QRCode',
    //   value: 'umoney'
    // }
  ]


  bankTitle: string = 'Banks';
  bankList: Array<any> = [
    // {
    //   image: `../../../../assets/logo/bcelone-logo.png`,
    //   name: 'BCEL One',
    //   title: 'BCEL One (optional)',
    //   detail: 'Pay your orders by using BCEL One QRCode',
    //   value: 'bcelone'
    // }
  ]

  methodList: Array<any> = [];

  reloadElement: any = {} as any;
  currentTitle: string;
  currentDetail: string;
  currentLogo: string;
  currentName: string;

  destroyTimer: any = {} as any;
  destroyCounter: number = 60;

  // MMoney
  _T:any
  constructor(
    public apiService: ApiService,
    public modal: ModalController
  ) { }

  async ngOnInit() {
    this.currentTitle = this.ewalletList[0].title;
    this.currentDetail = this.ewalletList[0].detail;
    this.currentLogo = this.ewalletList[0].image;
    this.currentName = this.ewalletList[0].name;
    this.methodList.push(...this.cashesList, ...this.ewalletList, ...this.bankList);
    this.loadBilling();
    this.loadPaymentMethods();
    await this.generateQRCode();
    this.loadDestroy();


    // mmoney
    if (this.currentName == 'MMoney') {
      const that = this;
      if(this._T)clearTimeout(this._T)
      this._T = setTimeout(() => {
        this.modal.dismiss();
      },1000*60*15);
     this.apiService.onStockDeduct((data)=>{
      console.log('onStockDeduct',data);
      that.modal.dismiss();
     })
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadElement);

    if(this._T)clearTimeout(this._T)
    this._T=null;
  }

  loadDestroy() {
    this.destroyTimer = setInterval(() => {
      this.destroyCounter--;
      if (this.destroyCounter == 0) {
        clearInterval(this.destroyTimer);
        this.destroyCounter = 60;

        (document.querySelector('.qr-img') as HTMLImageElement).src = '';
        this.orders = [];
        this.getTotalSale.q = 0;
        this.getTotalSale.t = 0;

        clearInterval(this.destroyTimer);
        this.destroyCounter = 60;

        this.apiService.myTab1.clearCart();  
        this.orderCartPage.dismiss();
        this.apiService.modal.dismiss();
      }
      console.log(`destroy in`, this.destroyCounter);
    }, 1000);
  }
  resetDestroy() {
    this.destroyCounter = 60;
  }

  loadBilling() {
    for(let i = 0; i < 50; i++) {
      const elm = document.createElement('div');
      elm.className = 'shape';
      this.shapesObject.push(elm);
    }
  }

  loadPaymentMethods() {
    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      const inputs = (document.querySelectorAll('.input-choice') as NodeListOf<HTMLInputElement>);
      const labels = (document.querySelectorAll('.label-choice') as NodeListOf<HTMLInputElement>);
      const imgs = (document.querySelectorAll('.img-choice') as NodeListOf<HTMLInputElement>);
      for(let i = 0; i < inputs.length; i++) {
        inputs[i].setAttribute('id', `method-choice-${i}`);
        labels[i].setAttribute('for', `method-choice-${i}`);
        inputs[i].addEventListener('click', async () => await this.selectPaymentMethods(i, inputs));
        imgs[i].addEventListener('click', async () => await this.selectPaymentMethods(i, inputs));
      }
      // mmoney default
      inputs[0].checked = true;
    });
  }
  selectPaymentMethods(i: number, inputs: NodeListOf<HTMLInputElement>): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        if (this.currentTitle == this.methodList[i].title) return resolve(IENMessage.success);

        inputs[i].checked = true;

        this.currentTitle = this.methodList[i].title;
        this.currentDetail = this.methodList[i].detail;
        this.currentLogo = this.methodList[i].image;
        this.currentName = this.methodList[i].name;
        
        this.billdate = new Date();
        await this.generateQRCode();

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  generateQRCode(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const qr = await new qrlogo({ logo: this.currentLogo, content: this.qrcode}).getCanvas();
        const qrcodeIMG = (document.querySelector('.qr-img') as HTMLImageElement);
        qrcodeIMG.src = qr.toDataURL();

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }


  close() {
    this.apiService.modal.dismiss({ buymore: false });
  }

  clearOrders(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const alert = this.apiService.alertConfirm(`Cancel paying orders and clear all`);
        if ((await alert).isConfirmed){
          this.orders = [];
          this.getTotalSale.q = 0;
          this.getTotalSale.t = 0;

          clearInterval(this.destroyTimer);
          this.destroyCounter = 15;

          this.apiService.myTab1.clearCart();  
          this.orderCartPage.dismiss();
          this.apiService.modal.dismiss();
        }

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  buymore() {
    clearInterval(this.destroyTimer);
    this.destroyCounter = 60;
    this.orderCartPage.dismiss({ buymore: true });
    this.modal.dismiss();
  }
}
