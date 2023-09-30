import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import qrlogo from 'qrcode-with-logos';
import { IENMessage, IGenerateQR } from 'src/app/models/base.model';
import { ModalController } from '@ionic/angular';
import { IBillProcess } from 'src/app/services/syste.model';
import { GenerateMMoneyQRCodeProcess } from '../../MMoney_processes/generateMMoneyQRCode.process';

@Component({
  selector: 'app-order-paid',
  templateUrl: './order-paid.page.html',
  styleUrls: ['./order-paid.page.scss'],
})
export class OrderPaidPage implements OnInit, OnDestroy {


  @Input() orders: Array<any>;
  @Input() getTotalSale: any;
  @Input() orderCartPage: any;

  private generateMMoneyQRCodeProcess: GenerateMMoneyQRCodeProcess;

  shapesObject: Array<any> = [];
  billdate: any = {} as any;

  cashesList: Array<any> = [
    // {
    //   image: `../../../../assets/logo/LAAB-logo.png`,
    //   name: 'LAAB',
    //   title: 'LAAB Wallet / Cash (optional)',
    //   detail: 'Pay your order by using LAAB',
    //   value: 'laab'
    // },
  ]

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
  currentValue: string;

  destroyTimer: any = {} as any;
  destroyCounter: number = 60;

  qrcode: string;
  elementLeft: HTMLDivElement = {} as any;
  elementRight: HTMLDivElement = {} as any;

  // MMoney
  _T:any

  constructor(
    public apiService: ApiService,
    public modal: ModalController
  ) { 

    this.generateMMoneyQRCodeProcess = new GenerateMMoneyQRCodeProcess(this.apiService);
  }

  async ngOnInit() {
    this.apiService.___OrderPaidPage = this.modal;

    this.methodList.push(...this.cashesList, ...this.ewalletList, ...this.bankList);
    this.loadBilling();
    this.loadPaymentMethods();

    // auto mmoney
    await this.mmoneyQRCode();
    await this.generateQRCode();
    this.loadDestroy();


    // ***** mmoney *****
    if (this.currentValue == IGenerateQR.mmoney) {
      const that = this;
      if(this._T)clearTimeout(this._T)
      this._T = setTimeout(() => {
        this.modal.dismiss();
      },1000*1000*15);
     this.apiService.onStockDeduct((data)=>{
      console.log('onStockDeduct',data);
      that.modal.dismiss();
     });
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadElement);
    clearInterval(this.destroyTimer);

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
        this.apiService.alertWarnning(IENMessage.timeout, IENMessage.qrcodeExpired);
      }
      console.log(`destroy in`, this.destroyCounter);
    }, 1000);
  }
  resetDestroy() {
    this.destroyCounter = 60;
  }

  loadBilling() {
    this.billdate = new Date();
    const current = this.methodList.filter(item => item.value == IGenerateQR.mmoney);
    this.currentTitle = current[0].title;
    this.currentDetail = current[0].detail;
    this.currentLogo = current[0].image;
    this.currentName = current[0].name;
    this.currentValue = current[0].value;

    for(let i = 0; i < 50; i++) {
      const elm = document.createElement('div');
      elm.className = 'shape';
      this.shapesObject.push(elm);
    }
  }

  loadPaymentMethods() {

    this.elementLeft = (document.querySelector('.form-order-paid .form-order-paid-left') as HTMLDivElement);
    this.elementRight = (document.querySelector('.form-order-paid .form-order-paid-right') as HTMLDivElement);

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
        console.log(`cc`, `.input-choice-${this.currentValue}`);
        (document.querySelector(`.input-choice-${this.currentValue}`) as HTMLInputElement).checked = true;
      }
    });
  }
  selectPaymentMethods(i: number, inputs: NodeListOf<HTMLInputElement>): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.elementLeft.classList.remove('active');
        this.elementRight.classList.remove('active');

        inputs[i].checked = true;
        this.currentTitle = this.methodList[i].title;
        this.currentDetail = this.methodList[i].detail;
        this.currentLogo = this.methodList[i].image;
        this.currentName = this.methodList[i].name;
        this.currentValue = this.methodList[i].value;

        let run: any = {} as any;
        if (this.currentValue == IGenerateQR.mmoney) {
          run = await this.mmoneyQRCode();
          if (run != IENMessage.success) throw new Error(run);
        }

        this.billdate = new Date();
        await this.generateQRCode();

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message); 
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
        this.elementLeft.classList.add('active');
        this.elementRight.classList.add('active');
        resolve(IENMessage.success);

      } catch (error) {
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

  setSummarizeOrder() {
    const summarizeOrder = JSON.parse(JSON.stringify(this.orders));
    summarizeOrder.forEach((item) => (item.stock.image = ''));
    let quantity: number = 0;
    let total: number = 0;
    for (let i = 0; i < summarizeOrder.length; i++) {
      quantity += summarizeOrder[i].stock.qtty;
      total +=
        summarizeOrder[i].stock.qtty *
        summarizeOrder[i].stock.price;
    }
    const sum_refund = this.apiService.cash.amount - total;

    return {
      message: IENMessage.success,
      summarizeOrder: summarizeOrder,
      quantity: quantity,
      total: total,
      sum_refund: sum_refund
    }
  }

  mmoneyQRCode(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        const setSummarizeOrder = this.setSummarizeOrder();

        const params = {
          orders: setSummarizeOrder.summarizeOrder,
          amount: setSummarizeOrder.total,
          machineId: this.apiService.machineId.machineId
        }

        const run = await this.generateMMoneyQRCodeProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.loadDestroy();


        this.qrcode = run.data[0].mmoneyQRCode.qr;

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }
}
