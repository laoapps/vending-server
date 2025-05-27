import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { EClientCommand, IVendingMachineBill, IVendingMachineSale } from 'src/app/services/syste.model';
import { OrderPaidPage } from '../order-paid/order-paid.page';
import { ModalController } from '@ionic/angular';
import qrlogo from 'qrcode-with-logos';
import { IENMessage, IGenerateQR } from 'src/app/models/base.model';
// import { GenerateMMoneyQRCodeProcess } from '../../MMoney_processes/generateMMoneyQRCode.process';
import { GenerateMMoneyQRCodeProcess } from '../../MMoney_processes/generateMMoneyQRCode.process';
// import Swal from 'sweetalert2';
import { PaidValidationProcess } from '../../LAAB_processes/paidValidation.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as cryptojs from 'crypto-js';

@Component({
    selector: 'app-order-cart',
    templateUrl: './order-cart.page.html',
    styleUrls: ['./order-cart.page.scss'],
    standalone: false
})
export class OrderCartPage implements OnInit, OnDestroy {

  @Input() orders: Array<any>;
  @Input() getTotalSale: any;
  contact = localStorage.getItem('contact') || '55516321';


  private paidValidationProcess: PaidValidationProcess;
  // private generateMMoneyQRCodeProcess: GenerateMMoneyQRCodeProcess;
  private generateLaoQRCodeProcess: GenerateMMoneyQRCodeProcess;

  // sweetalert: any = Swal;

  autoPaymentTimer: any = {} as any;
  autoPaymentCounter: number = 15;

  autoSelectPaymentMethodTimer: any = {} as any;
  autoSelectPaymentMethodCounter: number = 1;

  alertTime: any = {} as any;
  alertCounter: number = 5;

  destroyTimer: any = {} as any;
  destroyCounter: number = 60;

  qrcode: string;

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
    {
      image: `../../../../assets/logo/umoney-logo.png`,
      name: 'UMoney',
      title: 'UMoney (optional)',
      detail: 'Pay your orders by using UMoney QRCode',
      value: 'umoney'
    }
  ]


  bankList: Array<any> = [
    {
      image: `../../../../assets/logo/bcelone-logo.png`,
      name: 'BCEL One',
      title: 'BCEL One (optional)',
      detail: 'Pay your orders by using BCEL One QRCode',
      value: 'bcelone'
    }
  ]

  paymentList: Array<any> = [...this.cashesList, ...this.ewalletList, ...this.bankList];

  shapesObject: Array<any> = [];


  billdate: any = {} as any;
  reloadElement: any = {} as any;
  currentTitle: string;
  currentDetail: string;
  currentLogo: string;
  currentName: string;
  currentValue: string;

  elementLeft: HTMLDivElement = {} as any;
  elementRight: HTMLDivElement = {} as any;


  constructor(
    public apiService: ApiService,
    public modal: ModalController,
    public vendingAPIService: VendingAPIService
  ) {

    this.paidValidationProcess = new PaidValidationProcess(this.apiService, this.vendingAPIService);
    // this.generateMMoneyQRCodeProcess = new GenerateMMoneyQRCodeProcess(this.apiService);
    this.generateLaoQRCodeProcess = new GenerateMMoneyQRCodeProcess(this.apiService);


  }

  ngOnInit() {
    this.apiService.___OrderCartPage = this.modal;

    console.log(this.orders);
    console.log(this.getTotalSale);
    this.loadPaymentMethods();
    this.loadAutoPayment();
    this.loadArrowScrollSuggest();

    this.loadBilling();
  }

  ngOnDestroy(): void {
    clearInterval(this.autoPaymentTimer);
    clearInterval(this.autoSelectPaymentMethodTimer);
    clearInterval(this.destroyTimer);
    clearInterval(this.reloadElement);
    clearInterval(this.alertTime);

  }

  loadBilling() {
    this.billdate = new Date();
    const current = this.paymentList.filter(item => item.value == IGenerateQR.mmoney);
    this.currentTitle = current[0].title;
    this.currentDetail = current[0].detail;
    this.currentLogo = current[0].image;
    this.currentName = current[0].name;
    this.currentValue = current[0].value;

    for (let i = 0; i < 50; i++) {
      const elm = document.createElement('div');
      elm.className = 'shape';
      this.shapesObject.push(elm);
    }
  }

  loadArrowScrollSuggest() {
    const arrowscrollDOWN = (document.querySelector('.arrow-scroll-down') as HTMLSpanElement);
    const element = (document.querySelector('.order-list') as HTMLDivElement);
    if (this.orders != undefined && Object.entries(this.orders).length > 7) {
      arrowscrollDOWN.classList.add('active');
    } else {
      arrowscrollDOWN.classList.remove('active');
    }
  }
  toggleArrowScrollSuggest(e: any) {
    if (this.orders != undefined && Object.entries(this.orders).length > 7) {
      const element = (document.querySelector('.order-list') as HTMLDivElement);
      const arrowscrollUP = (document.querySelector('.arrow-scroll-up') as HTMLSpanElement);
      const arrowscrollDOWN = (document.querySelector('.arrow-scroll-down') as HTMLSpanElement);


      const currentScroll = Number(e.target.scrollTop);
      const elementHeight = Number(element.getBoundingClientRect().height);
      const elementScrollHeight = Number(element.scrollHeight);

      if (currentScroll + elementHeight < elementScrollHeight) {
        arrowscrollUP.classList.remove('active');
        arrowscrollDOWN.classList.add('active');
        this.autoPaymentCounter = 15;
      } else {
        arrowscrollUP.classList.add('active');
        arrowscrollDOWN.classList.remove('active');
        this.autoPaymentCounter = 15;
      }
    }
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
        this.apiService.modal.dismiss();
        this.apiService.alertWarnning(IENMessage.timeout, IENMessage.qrcodeExpired);
      }
      console.log(`destroy in`, this.destroyCounter);
    }, 1000);
  }

  close() {
    this.apiService.countErrorPay = 0;
    this.apiService.modal.dismiss();
  }

  loadAutoPayment() {
    this.autoPaymentTimer = setInterval(() => {
      this.autoPaymentCounter--;
      if (this.autoPaymentCounter <= 0) {
        clearInterval(this.autoPaymentTimer);
        this.autoPaymentCounter = 15;
        this.showPaymentMethod();
        // this.showOrderPaidModal();
      }
    }, 1000);
  }
  reloadAutoPayment() {
    this.autoPaymentCounter = 15;
    clearInterval(this.alertTime);
    this.alertCounter = 5;
  }

  removeOrder(order: any, index: number) {
    clearInterval(this.autoPaymentTimer);
    clearInterval(this.autoSelectPaymentMethodTimer);
    clearInterval(this.destroyTimer);

    this.destroyCounter = 60;
    this.currentValue = this.paymentList[0].value;

    const orderlist = (document.querySelector('.order-list') as HTMLDivElement);
    const footer = (document.querySelector('.laab-card-footer') as HTMLDivElement);
    const input = (document.querySelector(`.input-choice-${this.currentValue}`) as HTMLInputElement);
    const paymentGroupLeft = (document.querySelector('.payment-group-left') as HTMLDivElement);
    const paymentGroupRight = (document.querySelector('.payment-group-right') as HTMLDivElement);

    orderlist.classList.remove('hidden');
    footer.classList.remove('active');
    paymentGroupLeft.classList.remove('active');
    paymentGroupRight.classList.remove('active');

    input.checked = true;
    (document.querySelector('.qr-img') as HTMLImageElement).src = '';

    this.apiService.myTab1.removeCart(index);
    this.getSummarizeOrder();
    this.loadArrowScrollSuggest();
    this.loadAutoPayment();
    if (this.orders != undefined && Object.entries(this.orders).length == 0) {
      this.apiService.modal.dismiss();
    }
  }

  getSummarizeOrder() {
    const o = new Array<IVendingMachineSale>();
    const ord = JSON.parse(
      JSON.stringify(this.orders)
    ) as Array<IVendingMachineSale>;
    ord.forEach((v) => {
      const x = o.find((x) => x.stock.id == v.stock.id);
      if (!x) o.push(v);
      else x.stock.qtty += 1;
    });

    const t = this.getTotal();
    Object.keys(this.getTotalSale).forEach((k) => {
      this.getTotalSale[k] = t[k];
    });
  }
  getTotal() {
    const o = this.orders;
    const q = o.reduce((a, b) => {
      return a + b.stock.qtty;
    }, 0);
    const t = o.reduce((a, b) => {
      return a + b.stock.qtty * b.stock.price;
    }, 0);
    return { q, t };
  }

  showPaymentMethod() {
    const orderlist = (document.querySelector('.order-list') as HTMLDivElement);
    const footer = (document.querySelector('.laab-card-footer') as HTMLDivElement);
    const paymentGroupLeft = (document.querySelector('.payment-group-left') as HTMLDivElement);
    const paymentGroupRight = (document.querySelector('.payment-group-right') as HTMLDivElement);
    orderlist.classList.add('hidden');
    footer.classList.add('active');

    this.autoSelectPaymentMethodTimer = setInterval(async () => {
      try {

        this.autoSelectPaymentMethodCounter--;
        if (this.autoSelectPaymentMethodCounter == 0) {
          clearInterval(this.autoSelectPaymentMethodTimer);
          this.autoSelectPaymentMethodCounter = 1;

          if (this.apiService.cash.amount > 0 && this.apiService.cash.amount >= this.getTotalSale.t) {
            this.currentLogo = this.paymentList[0].image;
            this.qrcode = 'cash';
            paymentGroupLeft.classList.add('active');
            paymentGroupRight.classList.add('active');

            const run = await this.laabPaid();
            if (run != IENMessage.success) throw new Error(run);
            this.apiService.myTab1.clearStockAfterLAABGo();
            this.apiService.modal.dismiss();

          } else {

            // default mmoney
            let run: any = await this.laoQRCode();
            if (run != IENMessage.success) throw new Error(run);

            run = await this.generateQRCode();
            if (run != IENMessage.success) throw new Error(run);

            paymentGroupLeft.classList.add('active');
            paymentGroupRight.classList.add('active');

          }
        }

      } catch (error) {
        this.apiService.alertError(error.message);
      }

    }, 500);
  }


  clearOrders(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const alert = this.apiService.alertConfirm(`Cancel paying orders and clear all`);
        if ((await alert).isConnected) {
          this.orders = [];
          this.getTotalSale.q = 0;
          this.getTotalSale.t = 0;

          clearInterval(this.autoPaymentTimer);
          this.autoPaymentCounter = 15;

          this.apiService.myTab1.clearCart();
          this.apiService.modal.dismiss();
        }

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
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

  laabPaid(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const setSummarizeOrder = this.setSummarizeOrder();
        if (this.getTotalSale.q != setSummarizeOrder.quantity || this.getTotalSale.t != setSummarizeOrder.total) throw new Error(IENMessage.invalidSellDetail);

        const params = {
          machineId: this.apiService.machineId.machineId,
          cash: this.getTotalSale.t,
          description: 'VENDING WALLET COMMIT ORDER',
          paidLAAB: {
            command: EClientCommand.paidLAAB,
            data: {
              ids: setSummarizeOrder.summarizeOrder,
              value: setSummarizeOrder.total,
              clientId: this.apiService.clientId.clientId,
            },
            ip: '',
            time: new Date().toString(),
            token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex),
          }
        }

        const run = await this.paidValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.apiService.cash.amount = setSummarizeOrder.sum_refund;

        resolve(IENMessage.success);

      } catch (error) {
        // await this.apiService.soundPleaseTopUpValue();
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  generateQRCode(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const qr = await new qrlogo({ logo: this.currentLogo, content: this.qrcode }).getCanvas();
        const qrcodeIMG = (document.querySelector('.qr-img') as HTMLImageElement);
        qrcodeIMG.src = qr.toDataURL();
        this.elementLeft.classList.add('active');
        this.elementRight.classList.add('active');
        this.loadDestroy();
        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  // mmoneyQRCode(): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     try {
  //       const setSummarizeOrder = this.setSummarizeOrder();

  //       const params = {
  //         orders: setSummarizeOrder.summarizeOrder,
  //         amount: setSummarizeOrder.total,
  //         machineId: this.apiService.machineId.machineId
  //       }

  //       const run = await this.generateLaoQRCodeProcess.Init(params);
  //       if (run.message != IENMessage.success) throw new Error(run);
  //       // this.loadDestroy();


  //       this.qrcode = run.data[0].mmoneyQRCode.qr;
  //       this.currentLogo = this.paymentList[0].image;

  //       resolve(IENMessage.success);

  //     } catch (error) {
  //       resolve(error.message);
  //     }
  //   });
  // }


  laoQRCode(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const setSummarizeOrder = this.setSummarizeOrder();

        const params = {
          orders: setSummarizeOrder.summarizeOrder,
          amount: setSummarizeOrder.total,
          machineId: this.apiService.machineId.machineId
        }

        const run = await this.generateLaoQRCodeProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        // this.loadDestroy();


        this.qrcode = run.data[0].mmoneyQRCode.qr;
        this.currentLogo = this.paymentList[0].image;

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  loadPaymentMethods() {

    this.elementLeft = (document.querySelector('.payment-group-left') as HTMLDivElement);
    this.elementRight = (document.querySelector('.payment-group-right') as HTMLDivElement);

    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      const inputs = (document.querySelectorAll('.input-choice') as NodeListOf<HTMLInputElement>);
      const labels = (document.querySelectorAll('.label-choice') as NodeListOf<HTMLInputElement>);
      const imgs = (document.querySelectorAll('.img-choice') as NodeListOf<HTMLInputElement>);
      for (let i = 0; i < inputs.length; i++) {
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
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.elementLeft.classList.remove('active');
        this.elementRight.classList.remove('active');

        inputs[i].checked = true;
        this.currentTitle = this.paymentList[i].title;
        this.currentDetail = this.paymentList[i].detail;
        this.currentLogo = this.paymentList[i].image;
        this.currentName = this.paymentList[i].name;
        this.currentValue = this.paymentList[i].value;

        let run: any = {} as any;
        if (this.currentValue == IGenerateQR.mmoney) {
          run = await this.laoQRCode();
          if (run != IENMessage.success) throw new Error(run);

          this.billdate = new Date();
          run = await this.generateQRCode();
          if (run != IENMessage.success) throw new Error(run);
        }

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }


}
