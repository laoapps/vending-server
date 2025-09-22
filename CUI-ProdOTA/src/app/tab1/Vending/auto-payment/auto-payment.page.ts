import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { EClientCommand, EMessage, IVendingMachineSale } from 'src/app/services/syste.model';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { PaidValidationProcess } from '../../LAAB_processes/paidValidation.process';
import { GenerateLaoQRCodeProcess } from '../../LaoQR_processes/generateLaoQRCode.process';
import * as cryptojs from 'crypto-js';
import qrlogo from 'qrcode-with-logos';
import { WsapiService } from 'src/app/services/wsapi.service';
import { LoadVendingWalletCoinBalanceProcess } from '../../LAAB_processes/loadVendingWalletCoinBalance.process';
// import { RemainingbillsPage } from 'src/app/remainingbills/remainingbills.page';
import { GenerateMMoneyQRCodeProcess } from '../../MMoney_processes/generateMMoneyQRCode.process';
import { RemainingbilllocalPage } from 'src/app/remainingbilllocal/remainingbilllocal.page';

@Component({
  selector: 'app-auto-payment',
  templateUrl: './auto-payment.page.html',
  styleUrls: ['./auto-payment.page.scss'],
})
export class AutoPaymentPage implements OnInit, OnDestroy {
  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;

  @Input() orders: Array<any>;
  @Input() getTotalSale: any;
  contact = localStorage.getItem('contact') || '55516321';

  // @Input() serial: ISerialService;

  parseorders: Array<any> = [];
  parseGetTotalSale: any = {} as any;

  lists: Array<any> = [];
  drawCircle: Array<any> = [];
  billDate: Date;
  paymentmethod: string;
  paymentText: string;
  paymentLogo: string;
  isPayment: boolean = false;
  // isLoading: boolean = false;


  laabIcon: string = `../../../../assets/logo/LAAB-logo.png`;
  questionIcon: string = `../../../../assets/logo/question-logo.png`;

  // DOMS
  static orderlistElement: HTMLDivElement;
  static messageCount: HTMLDivElement;
  static laabCardFooter: HTMLDivElement;
  static billWaveElement: HTMLDivElement;
  static qrimgElement: HTMLImageElement;
  static btnLAABGo: HTMLHRElement;
  static countdownPaymentElement: HTMLDivElement;
  static autoPaymentPageElement: HTMLIonContentElement;
  static laabqrimgElement: HTMLImageElement;
  static ionbackdropElement: NodeListOf<HTMLIonBackdropElement>;

  // intervals
  reloadElement: any = {} as any;
  countdownBill: number = 1;
  countdownBillTimer: any = {} as any;
  countdownPayment: number = 5;
  countdownPaymentTimer: any = {} as any;
  reloadMessageElement: any = {} as any;
  countdownDestroy: number = 60;
  countdownDestroyTimer: any = {} as any;
  countdownCheckGenQrResTimer = {} as any;
  countdownCheckLAAB: number = 60;
  countdownCheckLAABTimer: any = {} as any;
  countdownLAABDestroy: number = 5;
  countdownLAABDestroyTimer: any = {} as any;
  countdownCheckLaoQRPaid: number = 90;
  countdownCheckLaoQRPaidTimer: any = {} as any;


  isEnableCheckCallback: boolean = true;


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
      value: 'mmoney',
      count: 5
    },
    // {
    //   image: `../../../../assets/logo/umoney-logo.png`,
    //   name: 'UMoney',
    //   title: 'UMoney (optional)',
    //   detail: 'Pay your orders by using UMoney QRCode',
    //   value: 'umoney'
    // }
  ]

  ewalletOptionList: Array<any> = [
    {
      image: `../../../../assets/logo/localbalance.png`,
      name: 'ເງິນໃນຕູ້',
      title: 'Local Balance (optional)',
      detail: 'Pay your orders by using Money in Machine',
      value: 'localBalance',
      count: 5
    },
  ]


  ewalletCheckList: Array<any> = [
    {
      image: `../../../../assets/logo/check.png`,
      name: 'ກວດເຄື່ອງ',
      title: 'ກໍລະນີຈ່າຍເງິນແລ້ວບໍ່ໄດ້ເຄື່ອງ',
      detail: 'Pay your orders by using Money in Machine',
      value: 'localBalance',
      count: 5
    },


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
  paymentOptions: Array<any> = [...this.ewalletOptionList];

  paymentCheck: Array<any> = [...this.ewalletCheckList];
  // qrPayment: boolean = localStorage.getItem('qrPayment') == 'yes' ? true : false;


  private workload: any = {} as any;



  // processes
  // private generateMMoneyQRCodeProcess: GenerateMMoneyQRCodeProcess;

  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;

  constructor(
    public apiService: ApiService,
    public modal: ModalController,
    public vendingAPIService: VendingAPIService,
    public WSAPIService: WsapiService
  ) {
    // this.apiService.___AutoPaymentPage = this.modal;

    this.loadVendingWalletCoinBalanceProcess = new LoadVendingWalletCoinBalanceProcess(this.apiService, this.vendingAPIService);
    this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);

  }

  async ngOnInit() {
    this.refreshOrder();

    // this.parseorders = JSON.parse(JSON.stringify(this.orders));
    // this.parseGetTotalSale = JSON.parse(JSON.stringify(this.getTotalSale));


    // this.parseorders = JSON.parse(localStorage.getItem(IENMessage.vendingPendingOrders));
    // this.parseGetTotalSale = JSON.parse(localStorage.getItem(IENMessage.vendingPendingSum));

    console.log(`order der`, this.parseorders);
    console.log(`--->`, this.parseGetTotalSale);
    // console.log('qrPayment', this.qrPayment);
    // if (this.qrPayment) {
    //   this.paymentList.push({
    //     image: `../../../../assets/logo/qrpayment.png`,
    //     name: 'Popup QR',
    //     title: 'Popup QR (optional)',
    //     detail: 'Pay your orders by using Popup QR',
    //     value: 'PopupQR'
    //   });
    // }
    console.log('paymentList', this.paymentList);



    this.loadDOMs();
    // this.loadFakeOrder();

    // websocket check when process callback
    this.apiService.onDelivery(res_delivery => {
      this.orders = [];
      this.getTotalSale.q = 0;
      this.getTotalSale.t = 0;
      this.apiService.myTab1.clearCart();
      this.close();
    });

    await this.loadCountDownBillNew();


  }

  enableClickMethod() {

  }

  refreshOrder() {
    const local = this.apiService.myTab1.localLoad();
    this.parseorders = local.orders;
    this.parseGetTotalSale = local.sum;
    this.orders = local.orders;
    this.getTotalSale = local.sum;
  }


  ngOnDestroy(): void {

    // intervals
    clearInterval(this.reloadElement);
    clearInterval(this.countdownBillTimer);
    clearInterval(this.countdownPaymentTimer);
    clearInterval(this.reloadMessageElement);
    clearInterval(this.countdownCheckLAABTimer);
    clearInterval(this.countdownDestroyTimer);
    clearInterval(this.countdownLAABDestroyTimer);
    clearInterval(this.countdownCheckLaoQRPaidTimer);
    // if (this.WSAPIService.waitingDelivery) this.WSAPIService.waitingDelivery.unsubscribe();

  }

  loadDOMs() {
    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      AutoPaymentPage.orderlistElement = (document.querySelector('.order-list') as HTMLDivElement);
      AutoPaymentPage.laabCardFooter = (document.querySelector('.laab-card-footer') as HTMLDivElement);
      AutoPaymentPage.billWaveElement = (document.querySelector('.bill-wave') as HTMLDivElement);
      AutoPaymentPage.qrimgElement = (document.querySelector('#qr-img') as HTMLImageElement);
      AutoPaymentPage.btnLAABGo = (document.querySelector('#btn-laab-go') as HTMLHRElement);
      AutoPaymentPage.laabqrimgElement = (document.querySelector('#laab-qr-img') as HTMLImageElement);
      AutoPaymentPage.ionbackdropElement = (document.querySelectorAll('ion-backdrop') as NodeListOf<HTMLIonBackdropElement>);
      this.checkOrders(AutoPaymentPage.orderlistElement);
    });
  }

  loadFakeOrder() {
    for (let i = 0; i < 15; i++) {
      const item = {
        "machineId": "11115010",
        "position": 1,
        "isActive": true,
        "id": -1, "max": 5,
        "stock": {
          "image": "f287d3aa0a30548dc0e97bb4e3eedb8f",
          "name": "LTC SIM",
          "price": 10000,
          "qtty": 1,
          "id": 123
        },
        "updatedAt": "2023-09-22T06:41:14.314Z"
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
    clearInterval(this.countdownCheckLAABTimer);
    clearInterval(this.countdownDestroyTimer);
    clearInterval(this.countdownLAABDestroyTimer);
    clearInterval(this.countdownCheckLaoQRPaidTimer);

    this.modal.dismiss();
  }





  loadCountDownBillNew(list?: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.countdownBillTimer = setTimeout(async () => {
          // this.countdownBill--;
          // if (this.countdownBill <= 0) {
          //   clearInterval(this.countdownBillTimer);
          //   this.countdownBill = 1;

          //   if (this.apiService.cash.amount < this.getTotalSale.t) {


          //   } else {
          //     // AutoPaymentPage.laabqrimgElement.classList.remove('active');
          //     AutoPaymentPage.btnLAABGo.classList.add('active');
          //   }

          //   const questqrcode = await new qrlogo({ logo: this.questionIcon, content: 'choose any payment method' }).getCanvas();
          //   if (AutoPaymentPage.qrimgElement) AutoPaymentPage.qrimgElement.src = questqrcode.toDataURL();

          //   this.checkOrders(AutoPaymentPage.orderlistElement);
          //   AutoPaymentPage.orderlistElement.className = 'order-list fit';
          //   AutoPaymentPage.laabCardFooter.classList.add('active');
          //   this.loadBillWave();

          //   if (!list) return resolve(await this._processLoopPayment());

          //   this.paymentmethod = list.value;
          //   this.paymentText = list.name;
          //   this.paymentLogo = list.image;
          //   resolve(await this._processLoopDestroyLastest());
          // }


          if (this.apiService.cash.amount < this.getTotalSale.t) {


          } else {
            // AutoPaymentPage.laabqrimgElement.classList.remove('active');
            AutoPaymentPage.btnLAABGo.classList.add('active');
          }

          const questqrcode = await new qrlogo({ logo: this.questionIcon, content: 'choose any payment method' }).getCanvas();
          if (AutoPaymentPage.qrimgElement) AutoPaymentPage.qrimgElement.src = questqrcode.toDataURL();

          this.checkOrders(AutoPaymentPage.orderlistElement);
          AutoPaymentPage.orderlistElement.className = 'order-list fit';
          AutoPaymentPage.laabCardFooter.classList.add('active');
          this.loadBillWave();

          if (!list) return resolve(await this._processLoopPayment());

          this.paymentmethod = list.value;
          this.paymentText = list.name;
          this.paymentLogo = list.image;
          resolve(await this._processLoopDestroyLastest());

        }, 1000);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  private _processLoopPayment(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        // loop generate
        this.countdownPaymentTimer = setTimeout(async () => {
          // this.countdownPayment--;
          // if (this.countdownPayment <= 0) {
          //   clearInterval(this.countdownPaymentTimer);
          //   this.countdownPayment = 5;




          // }

          if (this.apiService.cash.amount >= this.getTotalSale.t) {
            this.paymentmethod = IPaymentMethod.laab;
            await this.laabAutoCashin();
          }
          else {

            this.paymentmethod = IPaymentMethod.LaoQR;
            this.paymentText = this.paymentList[0].name;
            this.paymentLogo = this.paymentList[0].image;
            this._processLoopDestroyLastest();
          }
        }, 1000);

      } catch (error) {
        resolve(error.message);
      }
    });
  }




  private _processLoopDestroyLastest(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        let title: string = 'Destroy all orders';
        let text: string = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
        let cls: string = `countdownDestroy`;

        const params: IPaymentStation = {
          orders: this.parseorders,
          getTotalSale: this.parseGetTotalSale,
          paymentmethod: this.paymentmethod
        }
        console.log('START GENERATE LAOQR');

        // this.workload = this.apiService.load.create({ message: 'loading...' });
        // (await this.workload).present();

        clearInterval(this.countdownCheckGenQrResTimer);
        this.countdownCheckGenQrResTimer = setTimeout(async () => {
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          clearInterval(this.countdownDestroyTimer);
          this.countdownDestroy = 60;
          if (AutoPaymentPage.message) AutoPaymentPage.message.close();
          AutoPaymentPage.message = undefined;

          // this.apiService.myTab1.clearStockAfterLAABGo();
          this.close();
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
          return resolve(IENMessage.success);
        }, 60000);

        this.apiService.buyLaoQR(this.parseorders, this.parseGetTotalSale.t).then(async rx => {
          const r = rx.data;
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          const response: any = r;

          console.log(`response generate LaoQR`, response);
          if (response.status != 1) {

            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (AutoPaymentPage.message) AutoPaymentPage.message.close();
            AutoPaymentPage.message = undefined;

            // this.apiService.myTab1.clearStockAfterLAABGo();
            this.close();
            this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
            this.apiService.IndexedLogDB.addBillProcess({ errorData: `ERR Generate QR :${JSON.stringify(response)}` })
            return resolve(IENMessage.success);

          }

          const run = response.data;
          console.log('-----> SUCCESS GENERATE:', run);


          // this.qrcode = run.data[0].mmoneyQRCode.qr;

          const transactionID = run.transactionID;
          // console.log('transactionID', transactionID);
          // console.log('QR CODE :', run.qr);


          localStorage.setItem('transactionID', transactionID);

          const qrcode = await new qrlogo({ logo: this.paymentLogo, content: run.qr }).getCanvas();
          AutoPaymentPage.qrimgElement.src = qrcode.toDataURL();
          this.isPayment = true;
          // this.isLoading = false;
          this.billDate = new Date();
          console.log('END GENERATE LAOQR AND SUCCESS');
          // console.log('=====>RUN', run);
          // const transactionID = localStorage.getItem('transactionID');
          console.log('QR CODE :');

          this.countdownDestroyTimer = setInterval(async () => {
            this.countdownDestroy--;



            if (this.countdownDestroy <= 0) {
              clearInterval(this.countdownDestroyTimer);
              this.countdownDestroy = 60;
              if (AutoPaymentPage.message) AutoPaymentPage.message.close();
              AutoPaymentPage.message = undefined;

              this.apiService.myTab1.clearStockAfterLAABGo();
              this.close();
              this.apiService.alertTimeout('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321');
              return resolve(IENMessage.success);
            } else {
              AutoPaymentPage.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
              if (AutoPaymentPage.messageCount) AutoPaymentPage.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
              // if (AutoPaymentPage.messageCount) AutoPaymentPage.messageCount.textContent = `Test`;
            }

          }, 1000);


          return resolve(IENMessage.success);
        }, async error => {
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          clearInterval(this.countdownDestroyTimer);
          this.countdownDestroy = 60;
          if (AutoPaymentPage.message) AutoPaymentPage.message.close();
          AutoPaymentPage.message = undefined;

          // this.apiService.myTab1.clearStockAfterLAABGo();
          this.close();
          this.apiService.IndexedLogDB.addBillProcess({ errorData: `ERROR Generate QR :${JSON.stringify(error)}` })
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
          return resolve(IENMessage.success);
        });




      } catch (error) {
        // this.apiService.alertError(error.message);

        // when choose payment method and it does not work this process will auto loop check laab balance
        const transactionID = localStorage.getItem('transactionID');
        // this._processLoopCheckLaoQRPaid(transactionID ?? '');;
        // this._processLoopPayment();

        resolve(error.message);
      }
    });
  }


  private _processLoopDestroyPopupQR(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        let title: string = 'Destroy all orders';
        let text: string = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
        let cls: string = `countdownDestroy`;

        const params: IPaymentStation = {
          orders: this.parseorders,
          getTotalSale: this.parseGetTotalSale,
          paymentmethod: this.paymentmethod
        }
        console.log('START GENERATE POPUP QR');

        // this.workload = this.apiService.load.create({ message: 'loading...' });
        // (await this.workload).present();

        clearInterval(this.countdownCheckGenQrResTimer);
        this.countdownCheckGenQrResTimer = setTimeout(async () => {
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          clearInterval(this.countdownDestroyTimer);
          this.countdownDestroy = 60;
          if (AutoPaymentPage.message) AutoPaymentPage.message.close();
          AutoPaymentPage.message = undefined;

          // this.apiService.myTab1.clearStockAfterLAABGo();
          this.close();
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
          return resolve(IENMessage.success);
        }, 60000);

        this.apiService.buyTopUpQR(this.parseorders, this.parseGetTotalSale.t).then(async rx => {
          const r = rx.data;
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          const response: any = r;

          console.log(`response generate LaoQR`, response);
          if (response.status != 1) {

            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (AutoPaymentPage.message) AutoPaymentPage.message.close();
            AutoPaymentPage.message = undefined;

            // this.apiService.myTab1.clearStockAfterLAABGo();
            this.close();
            this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
            return resolve(IENMessage.success);

          }

          const run = response.data;
          console.log('-----> SUCCESS GENERATE:', run);



          const transactionID = run.transactionID;



          localStorage.setItem('transactionID', transactionID);

          // const qrcode = await new qrlogo({ logo: this.paymentLogo, content: run.qr }).getCanvas();
          AutoPaymentPage.qrimgElement.src = `../../../../assets/logo/scannow.gif`;
          this.isPayment = true;
          // this.isLoading = false
          this.billDate = new Date();
          console.log('END GENERATE LAOQR AND SUCCESS');

          console.log('QR CODE :');

          this.countdownDestroyTimer = setInterval(async () => {
            this.countdownDestroy--;



            if (this.countdownDestroy <= 0) {
              clearInterval(this.countdownDestroyTimer);
              this.countdownDestroy = 60;
              if (AutoPaymentPage.message) AutoPaymentPage.message.close();
              AutoPaymentPage.message = undefined;

              this.apiService.myTab1.clearStockAfterLAABGo();
              this.close();
              this.apiService.alertTimeout('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321');
              return resolve(IENMessage.success);
            } else {
              AutoPaymentPage.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
              if (AutoPaymentPage.messageCount) AutoPaymentPage.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
            }

          }, 1000);


          return resolve(IENMessage.success);
        }, async error => {
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          clearInterval(this.countdownDestroyTimer);
          this.countdownDestroy = 60;
          if (AutoPaymentPage.message) AutoPaymentPage.message.close();
          AutoPaymentPage.message = undefined;

          this.close();
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
          return resolve(IENMessage.success);
        });




      } catch (error) {
        // this.apiService.alertError(error.message);

        // when choose payment method and it does not work this process will auto loop check laab balance
        const transactionID = localStorage.getItem('transactionID');
        // this._processLoopCheckLaoQRPaid(transactionID ?? '');;
        // this._processLoopPayment();

        resolve(error.message);
      }
    });
  }


  private _processLoopDestroy(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        let title: string = 'Destroy all orders';
        let text: string = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
        let cls: string = `countdownDestroy`;

        const params: IPaymentStation = {
          orders: this.parseorders,
          getTotalSale: this.parseGetTotalSale,
          paymentmethod: this.paymentmethod
        }
        console.log('START GENERATE Mmoney');

        const run = await new PaymentStation(this.apiService, this.vendingAPIService).InitMMoney(params);
        // if (run.message != IENMessage.success) throw new Error(run);
        if (!run) {
          clearInterval(this.countdownDestroyTimer);
          this.countdownDestroy = 60;
          if (AutoPaymentPage.message) AutoPaymentPage.message.close();
          AutoPaymentPage.message = undefined;

          // this.apiService.myTab1.clearStockAfterLAABGo();
          this.close();
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາເລືອກ Lao QR ແທນ ຫຼືລອງອີກຄັ້ງໃນພາຍຫຼັງ');
          resolve(IENMessage.success);
        }

        const qrcode = await new qrlogo({ logo: this.paymentLogo, content: run.data[0].qrcode }).getCanvas();
        AutoPaymentPage.qrimgElement.src = qrcode.toDataURL();
        this.isPayment = true;
        // this.isLoading = false;
        this.billDate = new Date();
        console.log('END GENERATE Mmoney AND SUCCESS');
        console.log('=====>RUN', run);
        const transactionID = localStorage.getItem('transactionID');
        console.log('QR CODE MMoney:');

        // this._processLoopCheckLaoQRPaid(transactionID);




        // AutoPaymentPage.message = Swal.fire({
        //   position: 'top-end',
        //   html: this.messagetextModel(title, text, cls),
        //   showConfirmButton: false,
        //   heightAuto: false,
        //   backdrop: false
        // });

        // alert('TEST')

        // let checkLAAB: number = 55;
        // const previousAmount: number = this.apiService.cash.amount;

        // loop destroy
        this.countdownDestroyTimer = setInterval(async () => {
          this.countdownDestroy--;


          // console.log(`ERROR SHOULD NOT HERE`);

          if (this.countdownDestroy <= 0) {
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (AutoPaymentPage.message) AutoPaymentPage.message.close();
            AutoPaymentPage.message = undefined;

            this.apiService.myTab1.clearStockAfterLAABGo();
            this.close();
            this.apiService.alertError(IENMessage.timeout);
            resolve(IENMessage.success);
          } else {
            AutoPaymentPage.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
            if (AutoPaymentPage.messageCount) AutoPaymentPage.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
          }

        }, 1000);

      } catch (error) {
        // this.apiService.alertError(error.message);

        // when choose payment method and it does not work this process will auto loop check laab balance
        const transactionID = localStorage.getItem('transactionID');
        // this._processLoopCheckLaoQRPaid(transactionID ?? '');;
        // this._processLoopPayment();

        resolve(error.message);
      }
    });
  }


  // private _processLoopCheckLaoQRPaid(transactionID?: string): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     clearInterval(this.countdownCheckLaoQRPaidTimer);

  //     this.countdownCheckLaoQRPaidTimer = setInterval(async () => {
  //       console.log('transactionID', transactionID);

  //       this.countdownCheckLaoQRPaid -= 5;
  //       const run = await this.generateLaoQRCodeProcess.CheckLaoQRPaid();
  //       if (run.status == 1) {
  //         clearInterval(this.countdownCheckLaoQRPaidTimer);
  //         this.countdownCheckLaoQRPaid = 90;
  //         this.apiService.waitingDelivery(run.message['data']['bill']);

  //       }

  //       // console.log('=====> LAOQR RUN :', run);

  //       console.log(`=====>LAOQR LOOP`, this.countdownCheckLaoQRPaid);
  //       if (this.countdownCheckLaoQRPaid <= 0) {
  //         clearInterval(this.countdownCheckLaoQRPaidTimer);
  //         this.countdownCheckLaoQRPaid = 90;
  //         console.log('=====>LAOQR LOOP END');

  //         resolve(IENMessage.success);
  //       }
  //     }, 5000);
  //   });
  // }

  // loop check balance and loop destroy
  private _processLoopCheckLAAB(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        let checkLAAB: number = 55;
        const previousAmount: number = this.apiService.cash.amount;

        this.countdownCheckLAABTimer = setInterval(async () => {
          this.countdownCheckLAAB--;
          if (checkLAAB > -1 && this.countdownCheckLAAB == checkLAAB) {
            checkLAAB -= 5;

            const params = {
              machineId: localStorage.getItem('machineId')
            }

            const run = await this.loadVendingWalletCoinBalanceProcess.Init(params);
            if (run.message != IENMessage.success) throw new Error(run);
            this.apiService.cash.amount = run.data[0].vendingWalletCoinBalance;

            if (previousAmount != this.apiService.cash.amount) {
              // everytime when balance change stop loop and stop find laab
              clearInterval(this.countdownCheckLAABTimer);
              checkLAAB - 1;
              console.log(`LAAB CASHIN balance ${this.apiService.cash.amount} amount ${this.parseGetTotalSale.t}`);
              this.apiService.soundLaabIncreased();
              // AutoPaymentPage.laabqrimgElement.classList.remove('active');
              AutoPaymentPage.btnLAABGo.classList.add('active');
              await this.laabAutoCashin();

            } else {
              console.log(`LAAB CASH NOT ENOUGHT balance ${this.apiService.cash.amount} amount ${this.parseGetTotalSale.t}`);
            }
          }
          if (this.countdownCheckLAAB <= 0) {
            clearInterval(this.countdownCheckLAABTimer);
            this.countdownCheckLAAB = 60;

            this.apiService.myTab1.clearCart();
            this.close();
            this.apiService.alertError(IENMessage.orderCanceled);
          }
        }, 1000);

      } catch (error) {
        resolve(error.message);
      }
    });
  }
  // not loop check destroy only
  private laabAutoCashin(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.isPayment = false;
        // this.isLoading = true;
        this.paymentmethod = undefined;

        this.countdownLAABDestroyTimer = setInterval(async () => {
          this.countdownLAABDestroy--;
          if (this.countdownLAABDestroy <= 0) {
            clearInterval(this.countdownLAABDestroyTimer);
            console.log(`LAAB LOOP`, this.countdownLAABDestroy);
            this.countdownLAABDestroy = 5;

            // fixed
            await this.laabGo();

            resolve(IENMessage.success);
          }
        }, 1000);

      } catch (error) {
        resolve(error.message);
      }
    });
  }
  laabGo(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const params: IPaymentStation = {
          orders: this.orders,
          getTotalSale: this.getTotalSale,
          paymentmethod: IPaymentMethod.laab
        }
        const run = await new PaymentStation(this.apiService, this.vendingAPIService).Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.apiService.myTab1.refreshBalanceFromAnotherModal(Number(this.apiService.cash.amount) - Number(this.getTotalSale.t));
        this.apiService.myTab1.clearCart();
        this.close();

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }


  removeOrder(index: number) {
    this.parseorders.splice(index, 1);
    // this.getSummarizeOrder();

    this.apiService.myTab1.removeCart(index);
    this.refreshOrder();

    // this.parseGetTotalSale.q = this.parseorders.reduce((a,b) => a + b.stock.qtty, 0);
    // this.parseGetTotalSale.t = this.parseorders.reduce((a,b) => a + b.stock.qtty * b.stock.price, 0);

    if (this.parseorders != undefined && Object.entries(this.parseorders).length == 0) {
      this.resetMessage();
      this.close();
    }
    else {

      this.resetMessage();

      AutoPaymentPage.orderlistElement.className = 'order-list';
      this.checkOrders(AutoPaymentPage.orderlistElement);
      AutoPaymentPage.laabCardFooter.classList.remove('active');
      AutoPaymentPage.qrimgElement.src = '';
      this.isPayment = false;
      // this.isLoading = true;
      this.paymentText = '';
      this.paymentmethod = undefined;

      // hidden payment
      this.resetCountDownBillTimer();
      this.resetCountDownPaymentTimer();
      this.resetCountDownDestroyTimer();
      this.resetCountDownCheckLAABTimer();
      this.resetCountDownLAABDestroyTimer();

      this.countdownBill = 1;
      this.loadCountDownBillNew();
    }

  }
  choosePaymentMethod(list: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.paymentmethod = list.value;
        this.isPayment = false;
        // this.isLoading = true;

        if (AutoPaymentPage.message) AutoPaymentPage.message.close();
        AutoPaymentPage.message = undefined;

        this.resetCountDownBillTimer();
        this.resetCountDownPaymentTimer();
        this.resetCountDownDestroyTimer();
        this.resetCountDownCheckLAABTimer();

        this.paymentmethod = list.value;
        this.paymentLogo = list.image;
        console.log('=====>paymentmethod', this.paymentmethod);
        console.log('=====>paymentLogo', this.paymentLogo);

        if (this.paymentmethod == IPaymentMethod.mmoney) {
          this.paymentText = 'MMoney';
          resolve(await this._processLoopDestroy());
          resolve(IENMessage.success);
        } else if (this.paymentmethod == IPaymentMethod.LaoQR) {
          this.paymentText = 'Lao QR';
          resolve(await this._processLoopDestroyLastest());
          resolve(IENMessage.success);
        } else if (this.paymentmethod == IPaymentMethod.popupQR) {
          this.paymentText = 'Popup QR';
          resolve(await this._processLoopDestroyPopupQR());
          resolve(IENMessage.success);
        }
        else {

        }

        // resolve(await this._processLoopDestroyNew());


      } catch (error) {

        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }


  chooseLocalPaymentMethod(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.parseGetTotalSale.t <= this.apiService.localBalance) {
          if (this.apiService.myTab1.serial) {
            for (let index = 0; index < this.parseorders.length; index++) {
              // const element = array[index];
              this.parseorders[index].transactionID = new Date().getTime();
              this.apiService.IndexeLocaldDB.addBillProcess(this.parseorders[index]);
            }
            this.apiService.updateSellLocalBalance(this.parseGetTotalSale.t + '');
            console.log('=====>order for local', this.parseorders);
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (AutoPaymentPage.message) AutoPaymentPage.message.close();
            AutoPaymentPage.message = undefined;

            // this.apiService.myTab1.clearStockAfterLAABGo();
            this.apiService.myTab1.clearCart();
            this.close();
            this.apiService
              .showModal(RemainingbilllocalPage, { r: this.apiService.pb, serial: this.apiService.myTab1.serial }, false)
              .then((r) => {
                r.present();
              });
          } else {
            this.apiService.toast.create({
              message: 'serial not init',
              duration: 3000
            }).then(r => {
              r.present();
            })

            await this.apiService.myTab1.connect();
          }



        } else {
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາເລືອກຕົວເລືອກອື່ນແທນ ຫຼືລອງອີກຄັ້ງໃນພາຍຫຼັງ');
        }
      } catch (error) {

        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }

  checkCallbackMMoney(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.isEnableCheckCallback) {
          const run = await this.generateLaoQRCodeProcess.CheckCallbackMmoney();
          console.log('=====>checkCallbackMMoney', run);
          if (run.status == 1) {
            await this.apiService.myTab1._processLoopCheckLaoQRPaid();
          }
          this.isEnableCheckCallback = false;

        } else {
          console.log('not allow to click');
        }

        setTimeout(() => {
          this.isEnableCheckCallback = true;
        }, 5000);
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
    this.countdownBill = 1;
  }
  private resetCountDownPaymentTimer() {
    clearInterval(this.countdownPaymentTimer);
    this.countdownPayment = 5;
  }
  private resetCountDownDestroyTimer() {
    clearInterval(this.countdownDestroyTimer);
    this.countdownDestroy = 60;
  }
  private resetCountDownCheckLAABTimer() {
    clearInterval(this.countdownCheckLAABTimer);
    this.countdownCheckLAAB = 60;
  }
  private resetCountDownLAABDestroyTimer() {
    clearInterval(this.countdownLAABDestroyTimer);
    this.countdownCheckLAAB = 5;
  }

  private loadBillWave() {
    this.drawCircle = [];
    for (let i = 0; i < 50; i++) {
      const elm = document.createElement('div');
      elm.className = 'shape';
      this.drawCircle.push(elm);
    }
  }


  private resetMessage(): void {
    if (AutoPaymentPage.message) AutoPaymentPage.message.close();
    AutoPaymentPage.message = undefined;
  }
}

enum IPaymentMethod {
  laab = 'laab',
  mmoney = 'mmoney',
  LaoQR = 'LaoQR',
  bcelone = 'bcelone',
  popupQR = 'PopupQR'

}
interface IPaymentStation {
  orders: Array<any>,
  getTotalSale: any,
  paymentmethod: string,
}
class PaymentStation {

  private workload: any = {} as any;


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
    return new Promise<any>(async (resolve, reject) => {
      try {

        // this.workload = this.apiService.load.create({ message: 'loading...', duration: 5000 });
        // (await this.workload).present();

        this.InitParams(params);

        const ValidateParams = this.ValidateParams();
        if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

        // const LAABPayment = await this.LAABPayment();
        // if (LAABPayment != IENMessage.success) throw new Error(LAABPayment);

        const LaoQRPayment = await this.LaoQRPayment();
        console.log('=====> Init LaoQRPayment', LaoQRPayment);

        if (LaoQRPayment != IENMessage.success) {
          // throw new Error(LaoQRPayment);
          resolve(EMessage.error);
        }


        // (await this.workload).dismiss();
        resolve(this.Commit());

      } catch (error) {
        // (await this.workload).dismiss();
        resolve(error.message);
      }
    });
  }

  public InitMMoney(params: IPaymentStation): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        // this.workload = this.apiService.load.create({ message: 'loading...', duration: 5000 });
        // (await this.workload).present();
        this.InitParams(params);

        const ValidateParams = this.ValidateParams();
        if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

        const MMoneyQRPayment = await this.MMoneyPayment();
        if (MMoneyQRPayment != IENMessage.success) {
          // throw new Error(MMoneyQRPayment);
          resolve(null);
        }

        // (await this.workload).dismiss();
        resolve(this.Commit());

      } catch (error) {
        // (await this.workload).dismiss();
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
    return new Promise<any>(async (resolve, reject) => {
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
    return new Promise<any>(async (resolve, reject) => {
      try {

        if (this.paymentmethod != IPaymentMethod.mmoney) return resolve(IENMessage.success);

        const params: ILaoQRPayment = {
          orders: this.orders,
          getTotalSale: this.getTotalSale
        }
        console.log(`MMoney MODEL`, params);
        const run = await new MMoneyPayment(this.apiService, this.vendingAPIService).Init(params);
        if (run.message != IENMessage.success) {
          // throw new Error(run);
          resolve(null);
        }

        this.qrcode = run.data[0].qrcode;

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }


  private LaoQRPayment(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        if (this.paymentmethod != IPaymentMethod.LaoQR) return resolve(IENMessage.success);

        const params: ILaoQRPayment = {
          orders: this.orders,
          getTotalSale: this.getTotalSale
        }
        console.log(`LaoQR MODEL`, params);
        const run = await new LaoQRPayment(this.apiService, this.vendingAPIService).Init(params);
        if (run.message != IENMessage.success) {
          // throw new Error(run);
          resolve(EMessage.error);
        }

        this.qrcode = run.data[0].qrcode;
        console.log('=====>LAOQR', this.qrcode);


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
    return new Promise<any>(async (resolve, reject) => {
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
    this.qtty = this.data.reduce((a, b) => a + b.stock.qtty, 0);
    this.total = this.data.reduce((a, b) => a + b.stock.qtty * b.stock.price, 0);
    if (this.qtty != this.getTotalSale.q && this.total != this.getTotalSale.t) return IENMessage.invalidSumerizeOrder;
    if (this.amount < this.total) return IENMessage.balanceIsNotEnought;
    this.refund = this.amount - this.total;

    return IENMessage.success;
  }

  private Payment(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
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
            token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex),
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









// LaoQR
interface ILaoQRPayment {
  orders: Array<any>,
  getTotalSale: any,
}
class LaoQRPayment {

  // services
  private apiService: ApiService;
  private vendingAPIService: VendingAPIService;

  // processes
  // private generateMMoneyQRCodeProcess: GenerateMMoneyQRCodeProcess;

  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;

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
    // this.generateMMoneyQRCodeProcess = new GenerateMMoneyQRCodeProcess(this.apiService);
    this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);
  }

  public Init(params: ILaoQRPayment): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.InitParams(params);

        this.RemoveImageFromOrder();

        const SumerizeOrder = this.SumerizeOrder();
        if (SumerizeOrder != IENMessage.success) throw new Error(SumerizeOrder);

        const Payment = await this.Payment();
        if (Payment != IENMessage.success) {
          // throw new Error(Payment);
          resolve(EMessage.error);
        }

        resolve(this.Commit());

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  public CheckLaoQRPaid(): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
      try {
        const run = await this.generateLaoQRCodeProcess.CheckLaoQRPaid();
        resolve(run);
      } catch (error) {
        resolve({ status: 0, message: error.message });
      }
    }
    );
  }

  private InitParams(params: ILaoQRPayment): void {
    this.orders = params.orders;
    this.getTotalSale = params.getTotalSale;
  }

  private RemoveImageFromOrder(): void {
    this.data = JSON.parse(JSON.stringify(this.orders));
    this.data.forEach(item => item.stock.image = '');
  }

  private SumerizeOrder(): string {
    this.qtty = this.data.reduce((a, b) => a + b.stock.qtty, 0);
    this.total = this.data.reduce((a, b) => a + b.stock.qtty * b.stock.price, 0);
    if (this.qtty != this.getTotalSale.q && this.total != this.getTotalSale.t) return IENMessage.invalidSumerizeOrder;
    return IENMessage.success;
  }

  // private Payment(): Promise<any> {
  //   return new Promise<any> (async (resolve, reject) => {
  //     try {

  //       const params = {
  //         orders: this.data,
  //         amount: this.total,
  //         machineId: this.apiService.machineId.machineId
  //       }

  //       const run = await this.generateMMoneyQRCodeProcess.Init(params);
  //       if (run.message != IENMessage.success) throw new Error(run);
  //       this.qrcode = run.data[0].mmoneyQRCode.qr;
  //       resolve(IENMessage.success);

  //     } catch (error) {
  //       resolve(error.message);
  //     }
  //   });
  // }


  private Payment(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const params = {
          orders: this.data,
          amount: this.total,
          machineId: this.apiService.machineId.machineId
        }

        const run = await this.generateLaoQRCodeProcess.Init(params);

        if (run.message != IENMessage.success) {
          // throw new Error(run);
          resolve(EMessage.error)
        }
        this.qrcode = run.data[0].mmoneyQRCode.qr;
        // console.log('=====>LAOQR Payment', this.qrcode);

        const transactionID = run.data[0].mmoneyQRCode.transactionID;
        // console.log('=====>LAOQR', transactionID);
        localStorage.setItem('transactionID', transactionID);

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

  // private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;

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
    // this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);
  }

  public Init(params: ILaoQRPayment): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.InitParams(params);

        this.RemoveImageFromOrder();

        const SumerizeOrder = this.SumerizeOrder();
        if (SumerizeOrder != IENMessage.success) throw new Error(SumerizeOrder);

        const Payment = await this.Payment();
        if (Payment != IENMessage.success) {
          // throw new Error(Payment);
          resolve(null);
        }

        resolve(this.Commit());

      } catch (error) {
        resolve(error.message);
      }
    });
  }


  private InitParams(params: ILaoQRPayment): void {
    this.orders = params.orders;
    this.getTotalSale = params.getTotalSale;
  }

  private RemoveImageFromOrder(): void {
    this.data = JSON.parse(JSON.stringify(this.orders));
    this.data.forEach(item => item.stock.image = '');
  }

  private SumerizeOrder(): string {
    this.qtty = this.data.reduce((a, b) => a + b.stock.qtty, 0);
    this.total = this.data.reduce((a, b) => a + b.stock.qtty * b.stock.price, 0);
    if (this.qtty != this.getTotalSale.q && this.total != this.getTotalSale.t) return IENMessage.invalidSumerizeOrder;
    return IENMessage.success;
  }

  // private Payment(): Promise<any> {
  //   return new Promise<any> (async (resolve, reject) => {
  //     try {

  //       const params = {
  //         orders: this.data,
  //         amount: this.total,
  //         machineId: this.apiService.machineId.machineId
  //       }

  //       const run = await this.generateMMoneyQRCodeProcess.Init(params);
  //       if (run.message != IENMessage.success) throw new Error(run);
  //       this.qrcode = run.data[0].mmoneyQRCode.qr;
  //       resolve(IENMessage.success);

  //     } catch (error) {
  //       resolve(error.message);
  //     }
  //   });
  // }


  private Payment(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const params = {
          orders: this.data,
          amount: this.total,
          machineId: this.apiService.machineId.machineId
        }

        const run = await this.generateMMoneyQRCodeProcess.Init(params);

        if (run.message != IENMessage.success) {
          // throw new Error(run);
          resolve(null);
        }
        this.qrcode = run.data[0].mmoneyQRCode.qr;
        console.log('=====>MMoney Payment', this.qrcode);

        const transactionID = run.data[0].mmoneyQRCode.transactionID;
        // console.log('=====>LAOQR', transactionID);
        localStorage.setItem('transactionID', transactionID);

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