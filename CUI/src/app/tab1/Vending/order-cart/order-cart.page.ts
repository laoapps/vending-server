import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { EClientCommand, IVendingMachineBill, IVendingMachineSale } from 'src/app/services/syste.model';
import { OrderPaidPage } from '../order-paid/order-paid.page';
import { ModalController } from '@ionic/angular';
import qrlogo from 'qrcode-with-logos';
import { IENMessage } from 'src/app/models/base.model';
import { GenerateMMoneyQRCodeProcess } from '../../MMoney_processes/generateMMoneyQRCode.process';
import Swal from 'sweetalert2';
import { PaidValidationProcess } from '../../LAAB_processes/paidValidation.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as cryptojs from 'crypto-js';

@Component({
  selector: 'app-order-cart',
  templateUrl: './order-cart.page.html',
  styleUrls: ['./order-cart.page.scss'],
})
export class OrderCartPage implements OnInit, OnDestroy {

  @Input() orders: Array<any>;
  @Input() getTotalSale: any;

  private paidValidationProcess: PaidValidationProcess;

  sweetalert: any = Swal;

  autoPaymentTimer: any = {} as any;
  autoPaymentCounter: number = 15;

  alertTime: any = {} as any;
  alertCounter: number = 5;

  qrcode: IVendingMachineBill;

  constructor(
    public apiService: ApiService,
    public modal: ModalController,
    public vendingAPIService: VendingAPIService
  ) { 
    this.paidValidationProcess = new PaidValidationProcess(this.apiService, this.vendingAPIService);

  }

  ngOnInit() {
    console.log(this.orders);
    console.log(this.getTotalSale);
    this.loadAutoPayment();
    this.loadArrowScrollSuggest();
  }
  
  ngOnDestroy(): void {
    clearInterval(this.autoPaymentTimer);
    clearInterval(this.alertTime);

  }

  loadArrowScrollSuggest() {
    if (this.orders != undefined && Object.entries(this.orders).length > 4) {
      const arrowscrollDOWN = (document.querySelector('.arrow-scroll-down') as HTMLSpanElement);
      arrowscrollDOWN.classList.add('active');
    }
  }
  toggleArrowScrollSuggest(e: any) {
    if (this.orders != undefined && Object.entries(this.orders).length > 4) {
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

  close() {
    this.apiService.countErrorPay = 0;
    this.apiService.modal.dismiss();
  }

  loadAutoPayment() {
    this.autoPaymentTimer = setInterval(() => {
      this.autoPaymentCounter--;
      if (this.autoPaymentCounter <= 0) {
        clearInterval(this.autoPaymentTimer);
        this.showOrderPaidModal();
      }
    }, 1000);
  }
  reloadAutoPayment() {
    this.autoPaymentCounter = 15;
    clearInterval(this.alertTime);
    this.alertCounter = 5;
  }

  removeOrder(index: number) {
    this.apiService.myTab1.removeCart(index);
    this.getSummarizeOrder();
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
  showOrderPaidModal(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (this.orders != undefined && Object.entries(this.orders).length == 0) return;
        clearInterval(this.autoPaymentTimer);
        this.autoPaymentCounter = 15;

        if (this.apiService.cash.amount > 0 && this.apiService.cash.amount >= this.getTotalSale.t)
        {
          const run = await this.laabPaid();
          if (run != IENMessage.success) throw new Error(run);
          this.apiService.myTab1.clearStockAfterLAABGo();
          this.apiService.modal.dismiss();
          return resolve(IENMessage.success);
        }

        const component = OrderPaidPage;
        const props = {
          orders: this.orders,
          getTotalSale: this.getTotalSale,
          orderCartPage: this.modal,
        }

        const modal = this.apiService.modal.create({ component: component, componentProps: props, cssClass: 'dialog-fullscreen' });
        (await modal).present();
        (await modal).onDidDismiss().then(r => {
          if (r?.data?.buymore == false) {
            this.autoPaymentCounter = 15;
            this.loadAutoPayment();
          }
        });

        resolve(IENMessage.success);

      } catch (error) {
        console.log(`error`, error);
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }

  clearOrders(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const alert = this.apiService.alertConfirm(`Cancel paying orders and clear all`);
        if ((await alert).isConfirmed){
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
            token: cryptojs.SHA256(this.apiService.machineId.machineId +this.apiService.machineId.otp).toString(cryptojs.enc.Hex),
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
}
