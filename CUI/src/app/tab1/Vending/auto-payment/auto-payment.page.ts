import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { EClientCommand, IVendingMachineSale } from 'src/app/services/syste.model';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import Swal from 'sweetalert2';
import { PaidValidationProcess } from '../../LAAB_processes/paidValidation.process';
import { GenerateMMoneyQRCodeProcess } from '../../MMoney_processes/generateMMoneyQRCode.process';
import * as cryptojs from 'crypto-js';
import qrlogo from 'qrcode-with-logos';
import { WsapiService } from 'src/app/services/wsapi.service';

@Component({
  selector: 'app-auto-payment',
  templateUrl: './auto-payment.page.html',
  styleUrls: ['./auto-payment.page.scss'],
})
export class AutoPaymentPage implements OnInit, OnDestroy {


  @Input() orders: Array<any>;
  @Input() getTotalSale: any;

  parseorders: Array<any> = [];
  parseGetTotalSale: any = {} as any;
  
  lists: Array<any> = [];
  drawCircle: Array<any> = [];
  billDate: Date;
  paymentmethod: string;
  paymentText: string;
  paymentLogo: string;
  isPayment: boolean = false;

  laabIcon: string = `../../../../assets/logo/LAAB-logo.png`;
  questionIcon: string = `../../../../assets/logo/question-logo.png`;

  // DOMS
  static orderlistElement: HTMLDivElement;
  static messageCount: HTMLDivElement;
  static laabCardFooter: HTMLDivElement;
  static billWaveElement: HTMLDivElement;
  static qrimgElement: HTMLImageElement;
  static countdownPaymentElement: HTMLDivElement;
  static autoPaymentPageElement: HTMLIonContentElement;
  static laabqrimgElement: HTMLImageElement;
  static ionbackdropElement: NodeListOf<HTMLIonBackdropElement>;

  // intervals
  reloadElement: any = {} as any;
  countdownBill: number = 1;
  countdownBillTimer: any = {} as any;
  countdownPayment: number = 10;
  countdownPaymentTimer: any = {} as any;
  reloadMessageElement: any = {} as any;
  countdownDestroy: number = 60;
  countdownDestroyTimer: any = {} as any;
  countdownCheckLAAB: number = 60;
  countdownCheckLAABTimer: any = {} as any;


  // message
  static message: any = undefined;
  messageText: string = 
  `
    <div class="message-container" 
      style=
      "
        display: flex; 
        gap: 20px;
      "
    >
      <div 
        class="icon"
        style=
        "
          display: flex;
          width: 50px;
          justify-content: center;
          align-items: center;
          color: #CB4335;
          font-size: 30px;
        "
      >
        <i class="fa-solid fa-hourglass-end fa-shake"></i>
      </div>
      <div class="detail" 
        style=
        "
          display: flex; 
          flex-direction: column; 
          justify-content: start; 
          text-align: start;
        "
      >
        <div class="title">Auto Payment</div>
        <div class="text" id="countdownPayment">About ${this.countdownPayment} system will auto payment your orders</div>
      </div>
    </div>
  `;

  // static variable
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
  paymentList: Array<any> = [...this.cashesList, ...this.ewalletList, ...this.bankList];




  constructor(
    public apiService: ApiService,
    public modal: ModalController,
    public vendingAPIService: VendingAPIService,
    public WSAPIService: WsapiService
  ) { 

  }

  async ngOnInit() {
    this.parseorders = JSON.parse(JSON.stringify(this.orders));
    this.parseGetTotalSale = JSON.parse(JSON.stringify(this.getTotalSale));
    this.loadDOMs();
    this.loadFakeOrder();

    await this.loadCountDownBill();

    // websocket check when process callback
    this.apiService.onStockDeduct((data)=>{
      console.log('onStockDeduct',data);
      this.close();
    });

    this.WSAPIService.balanceUpdateSubscription.subscribe(async (r) => {
      if (r) {
        await this.apiService.myTab1.initVendingWalletCoinBalance();
      }
    });
  }

  ngOnDestroy(): void {
    
    // intervals
    clearInterval(this.reloadElement);
    clearInterval(this.countdownBillTimer);
    clearInterval(this.countdownPaymentTimer);
    clearInterval(this.reloadMessageElement);
    clearInterval(this.countdownDestroyTimer);
    clearInterval(this.countdownCheckLAABTimer);
  }

  loadDOMs() {
    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      AutoPaymentPage.orderlistElement = (document.querySelector('.order-list') as HTMLDivElement);
      AutoPaymentPage.laabCardFooter = (document.querySelector('.laab-card-footer') as HTMLDivElement);
      AutoPaymentPage.billWaveElement = (document.querySelector('.bill-wave') as HTMLDivElement);
      AutoPaymentPage.qrimgElement = (document.querySelector('#qr-img') as HTMLImageElement);
      AutoPaymentPage.laabqrimgElement = (document.querySelector('#laab-qr-img') as HTMLImageElement);
      AutoPaymentPage.ionbackdropElement = (document.querySelectorAll('ion-backdrop') as NodeListOf<HTMLIonBackdropElement>);
      this.checkOrders(AutoPaymentPage.orderlistElement);
    });
  }

  loadFakeOrder() {
    for(let i = 0; i < 15; i++) {
      const item = {
        "machineId":"11115010",
        "position":1,
        "isActive":true,
        "id":-1,"max":5,
        "stock": {
          "image":"f287d3aa0a30548dc0e97bb4e3eedb8f",
          "name":"LTC SIM",
          "price":10000,
          "qtty":1,
          "id":123
        },
        "updatedAt":"2023-09-22T06:41:14.314Z"
      }
    this.lists.push(item);
    }
  }

  

  close() {

    this.resetMessage();
    clearInterval(this.reloadElement);
    clearInterval(this.countdownBillTimer);
    clearInterval(this.countdownPaymentTimer);
    clearInterval(this.reloadMessageElement);
    clearInterval(this.countdownDestroyTimer);
    clearInterval(this.countdownCheckLAABTimer);
    this.apiService.modal.dismiss();
  }

  loadCountDownBill(list?: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.countdownBillTimer = setInterval(async () => {
          this.countdownBill--;
          if (this.countdownBill == 0) {
            clearInterval(this.countdownBillTimer);

            let qrModel = {
              type: 'CQR',
              mode: 'COIN',
              destination: this.apiService.laabuuid,
              amount: Number(this.getTotalSale.t) - Number(this.apiService.cash.amount),
              expire: '',
              options: {
                coinname: this.apiService.coinName,
                name: this.apiService.name,
              },
            };
            const qrcode = await new qrlogo({ logo: this.laabIcon, content: JSON.stringify(qrModel)}).getCanvas();
            AutoPaymentPage.laabqrimgElement.src = qrcode.toDataURL();

            const questqrcode = await new qrlogo({ logo: this.questionIcon, content: 'choose any payment method'}).getCanvas();
            AutoPaymentPage.qrimgElement.src = questqrcode.toDataURL();

            this.checkOrders(AutoPaymentPage.orderlistElement);
            AutoPaymentPage.orderlistElement.className = 'order-list fit';
            AutoPaymentPage.laabCardFooter.classList.add('active');
            this.loadBillWave();

            if (this.countdownBill == 0 && this.apiService.cash.amount >= this.getTotalSale.t)
            {
              this.paymentmethod = IPaymentMethod.laab;

              const params: IPaymentStation = {
                orders: this.parseorders,
                getTotalSale: this.parseGetTotalSale,
                paymentmethod: this.paymentmethod
              }
              const run = await new PaymentStation(this.apiService, this.vendingAPIService).Init(params);
              if (run.message != IENMessage.success) throw new Error(run);

              this.apiService.myTab1.clearStockAfterLAABGo();
              this.apiService.modal.dismiss();
              resolve(IENMessage.success);

            }
            else
            {
              if (!list) return resolve(await this._processLoopPayment());

              this.paymentmethod = list.value;
              this.paymentText = list.name;
              this.paymentLogo = list.image;
              resolve(await this._processLoopDestroy());
            }
            this.countdownBill = 1;
          }

        }, 1000);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private _processLoopPayment(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        // loop generate
        this.countdownPaymentTimer = setInterval(async () => {
          this.countdownPayment--;
          if (this.countdownPayment == 0) {
            clearInterval(this.countdownPaymentTimer);
            this.countdownPayment = 10;

            this.paymentmethod = IPaymentMethod.mmoney;
            this.paymentText = this.paymentList[0].name;
            this.paymentLogo = this.paymentList[0].image;

            this._processLoopDestroy();
          }
        }, 1000);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private _processLoopDestroy(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        let title: string = 'Destroy all orders';
        let text: string = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
        let cls: string = `countdownDestroy`;

        const params: IPaymentStation = {
          orders: this.parseorders,
          getTotalSale: this.parseGetTotalSale,
          paymentmethod: this.paymentmethod
        }
        const run = await new PaymentStation(this.apiService, this.vendingAPIService).Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
      
        const qrcode = await new qrlogo({ logo: this.paymentLogo, content: run.data[0].qrcode}).getCanvas();
        AutoPaymentPage.qrimgElement.src = qrcode.toDataURL();
        this.isPayment = true;
        this.billDate = new Date();
        this.orders = [];
        this.getTotalSale.q = 0;
        this.getTotalSale.t = 0;

        AutoPaymentPage.message = Swal.fire({
          position: 'top-end',
          html: this.messagetextModel(title, text, cls),
          showConfirmButton: false,
          heightAuto: false,
          backdrop: false
        });

        let checkLAAB: number = 55;
        const previousAmount: number = this.apiService.cash.amount;

        // loop destroy
        this.countdownDestroyTimer = setInterval(async () => {
          this.countdownDestroy--;

          // when choose payment method success and client has not scaned pay yet this process will loop check laab balance
          if (checkLAAB > 0 && this.countdownDestroy == checkLAAB) {
            checkLAAB-=5;

            if (previousAmount != this.apiService.cash.amount) {
              console.log(`LAAB CASHIN balance ${this.apiService.cash.amount} amount ${this.parseGetTotalSale.t}`);

              await this.laabAutoCashin();
              
              resolve(IENMessage.success);
              
            } else {
              console.log(`LAAB CASH NOT ENOUGHT balance ${this.apiService.cash.amount} amount ${this.parseGetTotalSale.t}`);
            }
          }

          if (this.countdownDestroy == 0) {
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (AutoPaymentPage.message) AutoPaymentPage.message.close();
            AutoPaymentPage.message = undefined;

            this.apiService.myTab1.clearStockAfterLAABGo(); 
            this.apiService.modal.dismiss();
            this.apiService.alertError(IENMessage.timeout);
            resolve(IENMessage.success);
          }
          AutoPaymentPage.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
          if (AutoPaymentPage.messageCount) AutoPaymentPage.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
          
        }, 1000);

      } catch (error) {
        this.apiService.alertError(error.message);

        // when choose payment method and it does not work this process will auto loop check laab balance
        this._processLoopCheckLAAB();

        resolve(error.message);
      }
    });
  }
  
  private _processLoopCheckLAAB(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        let checkLAAB: number = 55;
        const previousAmount: number = this.apiService.cash.amount;
        
        this.countdownCheckLAABTimer = setInterval(async () => {
          this.countdownCheckLAAB--;
          if (checkLAAB > 0 && this.countdownCheckLAAB == checkLAAB) {
            checkLAAB -= 5;

            if (previousAmount != this.apiService.cash.amount) {
              console.log(`LAAB CASHIN balance ${this.apiService.cash.amount} amount ${this.parseGetTotalSale.t}`);
              await this.laabAutoCashin();

            } else {
              console.log(`LAAB CASH NOT ENOUGHT balance ${this.apiService.cash.amount} amount ${this.parseGetTotalSale.t}`);
            }
          }
          if (this.countdownCheckLAAB == 0) {
            clearInterval(this.countdownCheckLAABTimer);
            this.countdownCheckLAAB = 60;

            this.apiService.myTab1.clearCart();  
            this.apiService.modal.dismiss();
            this.apiService.alertError(IENMessage.orderCanceled);
          }
        }, 1000);

      } catch (error) {
        resolve(error.message);
      }
    });
  }
  private laabAutoCashin(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.isPayment = false;
        this.paymentmethod = undefined;

        const params: IPaymentStation = {
          orders: this.parseorders,
          getTotalSale: this.parseGetTotalSale,
          paymentmethod: IPaymentMethod.laab
        }
        const run = await new PaymentStation(this.apiService, this.vendingAPIService).Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.apiService.myTab1.clearCart();  
        this.apiService.modal.dismiss();

        resolve(IENMessage.success);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  removeOrder(index: number) {
    this.parseorders.splice(index, 1);
    this.apiService.myTab1.removeCart(index);
    this.getSummarizeOrder();

    if (this.parseorders != undefined && Object.entries(this.parseorders).length == 0) {
      this.resetMessage();
      this.apiService.modal.dismiss();
    } 
    else
    {
      this.resetMessage();
  
      AutoPaymentPage.laabCardFooter.classList.remove('active');
      AutoPaymentPage.qrimgElement.src = '';
      this.isPayment = false;
      this.paymentText = '';
      this.paymentmethod = undefined;

      // hidden payment
      this.resetCountDownBillTimer();
      this.resetCountDownPaymentTimer();
      this.resetCountDownDestroyTimer();
      this.resetCountDownCheckLAABTimer();

      this.loadCountDownBill();
    }

  }
  choosePaymentMethod(list: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.paymentmethod = list.value;
        this.isPayment = false;

        if (AutoPaymentPage.message) AutoPaymentPage.message.close();
        AutoPaymentPage.message = undefined;
  
        this.resetCountDownBillTimer();
        this.resetCountDownPaymentTimer();
        this.resetCountDownDestroyTimer();
        this.resetCountDownCheckLAABTimer();
        this.getSummarizeOrder();

        this.paymentmethod = list.value;
        this.paymentLogo = list.image;
        resolve(await this._processLoopDestroy());

        resolve(IENMessage.success);

      } catch (error) {

        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }






  // DOM section
  private checkOrders(orderlistElement: HTMLDivElement) {
    const lists: Array<any> = this.orders;
    // const lists: Array<any> = this.lists;
    const height7Order: boolean = lists != undefined && Object.entries(lists).length > 0 && Object.entries(lists).length <= 7;
    const height11Order: boolean = lists != undefined && Object.entries(lists).length > 7 && Object.entries(lists).length <= 11;
    const height15Order: boolean = lists != undefined && Object.entries(lists).length > 11 && Object.entries(lists).length <= 15;
    const height19Order: boolean = lists != undefined && Object.entries(lists).length > 15 && Object.entries(lists).length <= 19;


    if (height7Order) {
      console.log(`7 orders`);
      orderlistElement.classList.add('order-7');
    } else if (height11Order) {
      console.log(`11 orders`);
      orderlistElement.classList.add('order-11');
    } else if (height15Order) {
      console.log(`15 orders`);
      orderlistElement.classList.add('order-15');
    } else {
      console.log(`19 orders`);
      orderlistElement.classList.add('order-19');
    }
  }


  // refactor section
  getSummarizeOrder() {
    const o = new Array<IVendingMachineSale>();
    // const ord = JSON.parse(
    //   JSON.stringify(this.orders)
    // ) as Array<IVendingMachineSale>;
    const ord = this.parseorders as Array<IVendingMachineSale>;
    ord.forEach((v) => {
      const x = o.find((x) => x.stock.id == v.stock.id);
      if (!x) o.push(v);
      else x.stock.qtty += 1;
    });

    const t = this.getTotal();
    Object.keys(this.parseGetTotalSale).forEach((k) => {
      this.parseGetTotalSale[k] = t[k];
    });
  }
  getTotal() {
    const o = this.parseorders;
    const q = o.reduce((a, b) => {
      return a + b.stock.qtty;
    }, 0);
    const t = o.reduce((a, b) => {
      return a + b.stock.qtty * b.stock.price;
    }, 0);
    return { q, t };
  }

  private resetCountDownBillTimer() {
    clearInterval(this.countdownBillTimer);
    this.countdownPayment = 10;
  }
  private resetCountDownPaymentTimer() {
    clearInterval(this.countdownPaymentTimer);
    this.countdownPayment = 10;
  }
  private resetCountDownDestroyTimer() {
    clearInterval(this.countdownDestroyTimer);
    this.countdownDestroy = 60;
  }
  private resetCountDownCheckLAABTimer() {
    clearInterval(this.countdownCheckLAABTimer);
    this.countdownCheckLAAB = 60;
  }

  private loadBillWave() {
    for(let i = 0; i < 50; i++) {
      const elm = document.createElement('div');
      elm.className = 'shape';
      this.drawCircle.push(elm);
    }
  }

  private messagetextModel(title: string, text: string, cls: string): string {
    const result: string = 
    `
      <div class="message-container" 
        style=
        "
          display: flex; 
          gap: 20px;
        "
      >
        <div 
          class="icon"
          style=
          "
            display: flex;
            width: 50px;
            justify-content: center;
            align-items: center;
            color: #CB4335;
            font-size: 30px;
          "
        >
          <i class="fa-solid fa-dumpster-fire fa-shake"></i>
        </div>
        <div class="detail" 
          style=
          "
            display: flex; 
            flex-direction: column; 
            justify-content: start; 
            text-align: start;
          "
        >
          <div class="title">${title}</div>
          <div class="text" id="${cls}">${text}</div>
        </div>
      </div>
    `
    return result;
  }
  private resetMessage(): void {
    if (AutoPaymentPage.message) AutoPaymentPage.message.close();
    AutoPaymentPage.message = undefined;
  }
}

enum IPaymentMethod {
  laab = 'laab',
  mmoney = 'mmoney'
}
interface IPaymentStation {
  orders: Array<any>,
  getTotalSale: any,
  paymentmethod: string,
}
class PaymentStation {


  // services
  private apiService: ApiService;
  private vendingAPIService: VendingAPIService;

  // paramters
  private orders: Array<any> = [];
  private getTotalSale: any = {} as any;
  private paymentmethod: string;

  // props
  refund: number = 0;
  qrcode: string;


  constructor(
    apiService: ApiService,
    vendingAPIService: VendingAPIService
  ) { 
    this.apiService = apiService;
    this.vendingAPIService = vendingAPIService;
  }

  public Init(params: IPaymentStation): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.InitParams(params);

        const ValidateParams = this.ValidateParams();
        if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

        const LAABPayment = await this.LAABPayment();
        if (LAABPayment != IENMessage.success) throw new Error(LAABPayment);

        const MMoneyPayment = await this.MMoneyPayment();
        if (MMoneyPayment != IENMessage.success) throw new Error(MMoneyPayment);

        resolve(this.Commit());

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private InitParams(params: IPaymentStation): void {
    this.orders = params.orders;
    this.getTotalSale = params.getTotalSale;
    this.paymentmethod = params.paymentmethod;
  }
  
  private ValidateParams(): string {
    if (this.orders != undefined && Object.entries(this.orders).length == 0) return IENMessage.parametersEmpty;
    if (!(this.getTotalSale.t && this.getTotalSale.q && this.paymentmethod)) return IENMessage.parametersEmpty;
    return IENMessage.success;
  }

  private LAABPayment(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        if (this.paymentmethod != IPaymentMethod.laab) return resolve(IENMessage.success);

        const params: ILAABPayment = {
          orders: this.orders,
          getTotalSale: this.getTotalSale,
          amount: this.apiService.cash.amount
        }
        const run = await new LAABPayment(this.apiService, this.vendingAPIService).Init(params);
        console.log(`LAABPayment`, run);
        if (run.message != IENMessage.success) throw new Error(run);

        this.refund = run.data[0].refund;

        resolve(IENMessage.success);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private MMoneyPayment(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        if (this.paymentmethod != IPaymentMethod.mmoney) return resolve(IENMessage.success);

        const params: IMMoneyPayment = {
          orders: this.orders,
          getTotalSale: this.getTotalSale
        }
        const run = await new MMoneyPayment(this.apiService, this.vendingAPIService).Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.qrcode = run.data[0].qrcode;

        resolve(IENMessage.success);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private Commit() {
    const response = {
      data: [{
        refund: this.refund,
        qrcode: this.qrcode
      }],
      message: IENMessage.success
    }
    return response;
  }
}





// LAAB
interface ILAABPayment {
  orders: Array<any>,
  getTotalSale: any,
  amount: number
}
class LAABPayment {

  // services
  private apiService: ApiService;
  private vendingAPIService: VendingAPIService;

  // processes
  private paidValidationProcess: PaidValidationProcess;

  private orders: Array<any> = [];
  private getTotalSale: any = {} as any;
  private amount: number;

  // props
  private data: Array<any> = [];
  private qtty: number = 0;
  private total: number = 0;
  private refund: number = 0;
  
  constructor(
    apiService: ApiService,
    vendingAPIService: VendingAPIService
  ) {
    this.apiService = apiService;
    this.vendingAPIService = vendingAPIService;
    this.paidValidationProcess = new PaidValidationProcess(this.apiService, this.vendingAPIService);
  }

  public Init(params: ILAABPayment): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.InitParams(params);

        this.RemoveImageFromOrder();

        const SumerizeOrder = this.SumerizeOrder();
        if (SumerizeOrder != IENMessage.success) throw new Error(SumerizeOrder);

        const Payment = await this.Payment();
        if (Payment != IENMessage.success) throw new Error(Payment);

        resolve(this.Commit());

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private InitParams(params: ILAABPayment): void {
    this.orders = params.orders;
    this.getTotalSale = params.getTotalSale;
    this.amount = params.amount;
  }

  private RemoveImageFromOrder(): void {
    this.data = JSON.parse(JSON.stringify(this.orders));
    this.data.forEach(item => item.stock.image = '');
  }

  private SumerizeOrder(): string {
    this.qtty = this.data.reduce((a,b) => a + b.stock.qtty, 0);
    this.total = this.data.reduce((a,b) => a + b.stock.qtty * b.stock.price, 0);
    if (this.qtty != this.getTotalSale.q && this.total != this.getTotalSale.t) return IENMessage.invalidSumerizeOrder;
    if (this.amount < this.total) return IENMessage.balanceIsNotEnought;
    this.refund = this.amount - this.total;

    return IENMessage.success;
  }

  private Payment(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const params = {
          machineId: this.apiService.machineId.machineId,
          cash: this.total,
          description: 'VENDING WALLET COMMIT ORDER',
          paidLAAB: {
            command: EClientCommand.paidLAAB,
            data: {
              ids: this.data,
              value: this.total,
              clientId: this.apiService.clientId.clientId,
            },
            ip: '',
            time: new Date().toString(),
            token: cryptojs.SHA256(this.apiService.machineId.machineId +this.apiService.machineId.otp).toString(cryptojs.enc.Hex),
          }
        }

        const run = await this.paidValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        resolve(IENMessage.success);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private Commit() {
    const response = {
      data: [
        {
          refund: this.refund
        }
      ],
      message: IENMessage.success
    }
    return response;
  }

}









// MMONEY
interface IMMoneyPayment {
  orders: Array<any>,
  getTotalSale: any,
}
class MMoneyPayment {

  // services
  private apiService: ApiService;
  private vendingAPIService: VendingAPIService;

  // processes
  private generateMMoneyQRCodeProcess: GenerateMMoneyQRCodeProcess;

  private orders: Array<any> = [];
  private getTotalSale: any = {} as any;

  // props
  private data: Array<any> = [];
  private qtty: number = 0;
  private total: number = 0;
  private qrcode: string;
  
  constructor(
    apiService: ApiService,
    vendingAPIService: VendingAPIService
  ) {
    this.apiService = apiService;
    this.vendingAPIService = vendingAPIService;
    this.generateMMoneyQRCodeProcess = new GenerateMMoneyQRCodeProcess(this.apiService);
  }

  public Init(params: IMMoneyPayment): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.InitParams(params);

        this.RemoveImageFromOrder();

        const SumerizeOrder = this.SumerizeOrder();
        if (SumerizeOrder != IENMessage.success) throw new Error(SumerizeOrder);

        const Payment = await this.Payment();
        if (Payment != IENMessage.success) throw new Error(Payment);

        resolve(this.Commit());

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private InitParams(params: IMMoneyPayment): void {
    this.orders = params.orders;
    this.getTotalSale = params.getTotalSale;
  }

  private RemoveImageFromOrder(): void {
    this.data = JSON.parse(JSON.stringify(this.orders));
    this.data.forEach(item => item.stock.image = '');
  }

  private SumerizeOrder(): string {
    this.qtty = this.data.reduce((a,b) => a + b.stock.qtty, 0);
    this.total = this.data.reduce((a,b) => a + b.stock.qtty * b.stock.price, 0);
    if (this.qtty != this.getTotalSale.q && this.total != this.getTotalSale.t) return IENMessage.invalidSumerizeOrder;
    return IENMessage.success;
  }

  private Payment(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const params = {
          orders: this.data,
          amount: this.total,
          machineId: this.apiService.machineId.machineId
        }

        const run = await this.generateMMoneyQRCodeProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.qrcode = run.data[0].mmoneyQRCode.qr;
        resolve(IENMessage.success);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private Commit() {
    const response = {
      data: [
        {
          qrcode: this.qrcode
        }
      ],
      message: IENMessage.success
    }
    return response;
  }

}