import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { EClientCommand, EMessage, IMachineId, IVendingMachineSale } from 'src/app/services/syste.model';
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
import { BlockchainDbService } from 'src/app/blockchain-db';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { downloadPhotoUrl } from '../../../filemanager-url';
import { IdleService } from 'src/app/services/idle.service';


@Component({
  selector: 'app-hm-checkout-dock',
  templateUrl: './hm-checkout-dock.component.html',
  styleUrls: ['./hm-checkout-dock.component.scss'],
  imports: [CommonModule,
    FormsModule,
    IonicModule,],
  standalone: true
})
export class HmCheckoutDockComponent implements OnInit, OnDestroy, OnChanges {
  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;

  @Input() orders: Array<IVendingMachineSale>=[];
  @Input() getTotalSale = { q: 0, t: 0 };
  @Input() contact = localStorage.getItem('contact') || '55516321';
  @Input() machineId = {} as IMachineId;
  @Input() cashValue = 0;
  @Input() localBalance = 0;
  @Input() allowCashIn = false;
  @Input() isQrPayment = false;

  @Output() removeAt = new EventEmitter<number>();
  @Output() buyMore = new EventEmitter<void>();
  @Output() cartCleared = new EventEmitter<void>();
  @Output() paid = new EventEmitter<any>();

  qrDataUrl = '';

  // @Input() serial: ISerialService;

  parseorders: Array<any> = [];
  parseGetTotalSale: any = {} as any;

  lists: Array<any> = [];
  drawCircle: Array<any> = [];
  billDate: Date = new Date();
  paymentmethod: string='';
  paymentText: string='';
  paymentLogo: string='';
  isPayment: boolean = false;
  // isLoading: boolean = false;

  // QR generate retry (vending: unlimited retries within window, always auto-close)
  showQrRetry: boolean = false;
  isQrGenerating: boolean = false;
  qrRetryCount: number = 0;
  readonly qrGenTimeoutSec: number = 60;
  readonly qrRetryWindowSec: number = 60;
  readonly pageHardCloseSec: number = 240; // absolute max — never leave this modal open forever
  countdownQrGen: number = 60;
  countdownQrRetry: number = 60;
  countdownQrRetryTimer: any = {} as any;
  countdownQrGenTimer: any = {} as any;
  pageHardCloseTimer: any = {} as any;
  private qrRequestId: number = 0;


  laabIcon: string = `../../../../assets/logo/LAAB-logo.png`;
  questionIcon: string = `../../../../assets/logo/question-logo.png`;

  gifImage: string = `../../../../assets/logo/scanqr.gif`;


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


  bankList: Array<any> = []
  paymentList: Array<any> = [];
  paymentOptions: Array<any> = [...this.ewalletOptionList];

  paymentCheck: Array<any> = [...this.ewalletCheckList];
  // qrPayment: boolean = localStorage.getItem('qrPayment') == 'yes' ? true : false;


  private workload: any = {} as any;
  currentBalance = { value: 0, currency: 'LAK' };


  // processes
  // private generateMMoneyQRCodeProcess: GenerateMMoneyQRCodeProcess;

  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;

  constructor(
    public apiService: ApiService,
    public modalCtrl: ModalController,
    public vendingAPIService: VendingAPIService,
    public WSAPIService: WsapiService,
    public blockchainDbService: BlockchainDbService,
    public idleService: IdleService


  ) {
    this.apiService.___AutoPaymentPage = this.modalCtrl;

    this.loadVendingWalletCoinBalanceProcess = new LoadVendingWalletCoinBalanceProcess(this.apiService, this.vendingAPIService);
    this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);

  }
  private async loadBalance() {
    try {
      this.currentBalance.value = await this.blockchainDbService.getLocalBalance(this.machineId.machineId);
      this.currentBalance.currency = localStorage.getItem('currency') || 'LAK';

      console.log('Current local balance:', this.currentBalance.value);
    } catch (e) {
      console.error('Failed to load balance:', e);
      this.currentBalance.value = 0;
    }
  }
  async ngOnInit() {
    this.machineId = this.machineId?.machineId ? this.machineId : this.apiService.machineId;
    const useQrPayment = this.isQrPayment || this.apiService.isQrPayment;
    const useCashIn = this.allowCashIn || this.apiService.allowCashIn;

    this.bankList.push(...[
      {
        image: `../../../../assets/logo/laoqr.png`,
        name: 'Lao QR',
        title: 'Lao QR (optional)',
        detail: 'Pay your orders by using Lao QR One QRCode',
        value: 'LaoQR'
      },

    ]);

    if (useQrPayment) {
      this.bankList.push({
        image: `../../../../assets/logo/LAAB-logo.png`,
        name: 'LAABX',
        title: 'LAABX (optional)',
        detail: 'Pay your orders by using LAABX QRCode',
        value: 'LAABX'
      });
    }
    console.log('NV9USB', localStorage.getItem('NV9USB'));
    if (localStorage.getItem('NV9USB')) {
      if (useCashIn) {
        this.bankList.unshift(
          {
            image: `../../../../assets/logo/lak-cash.png`,
            name: 'Cash',
            title: 'Cash (optional)',
            detail: 'Pay your orders by using Cash',
            value: 'cash'
          })
      }

    }
    console.log('bankList', this.bankList);
    this.paymentList.push(...[...this.cashesList, ...this.bankList]);
    this.loadBalance();
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
      if (!res_delivery) return;
      this.orders = [];
      this.getTotalSale.q = 0;
      this.getTotalSale.t = 0;
      this.apiService.myTab1.clearCart();
      this.paid.emit(res_delivery);
      this.close();
    });

this.scheduleGenerate(); 
this.bumpIdle();


  }


  enableClickMethod() {

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
    clearInterval(this.countdownQrRetryTimer);
    clearInterval(this.countdownQrGenTimer);
    clearTimeout(this.countdownCheckGenQrResTimer);
    clearTimeout(this.pageHardCloseTimer);
    // if (this.WSAPIService.waitingDelivery) this.WSAPIService.waitingDelivery.unsubscribe();

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
    clearInterval(this.countdownQrRetryTimer);
    clearInterval(this.countdownQrGenTimer);
    clearTimeout(this.countdownCheckGenQrResTimer);
    clearTimeout(this.pageHardCloseTimer);
    this.showQrRetry = false;
    this.isQrGenerating = false;
    this.qrDataUrl = '';
    this.cartCleared.emit();
    try {
      this.modalCtrl.dismiss();
    } catch (e) { }
  }



  /** Absolute max lifetime for this payment page — never hang forever */
  private startPageHardClose(): void {
    clearTimeout(this.pageHardCloseTimer);
    this.pageHardCloseTimer = setTimeout(() => {
      this.exitAfterQrFail('PAGE HARD CLOSE timeout');
    }, this.pageHardCloseSec * 1000);
  }

  private startQrGenCountdown(requestId: number): void {
    clearInterval(this.countdownQrGenTimer);
    clearTimeout(this.countdownCheckGenQrResTimer);
    this.isQrGenerating = true;
    this.countdownQrGen = this.qrGenTimeoutSec;
    this.countdownQrGenTimer = setInterval(() => {
      this.countdownQrGen--;
      if (this.countdownQrGen <= 0) {
        clearInterval(this.countdownQrGenTimer);
        if (requestId !== this.qrRequestId) return;
        this.handleQrGenerateFailed(`TIMEOUT Generate QR requestId=${requestId}`);
      }
    }, 1000);
  }

  private stopQrGenCountdown(): void {
    clearInterval(this.countdownQrGenTimer);
    clearTimeout(this.countdownCheckGenQrResTimer);
    this.isQrGenerating = false;
  }

  private startQrRetryCountdown(): void {
    clearInterval(this.countdownQrRetryTimer);
    this.countdownQrRetry = this.qrRetryWindowSec;
    this.countdownQrRetryTimer = setInterval(() => {
      this.countdownQrRetry--;
      if (this.countdownQrRetry <= 0) {
        clearInterval(this.countdownQrRetryTimer);
        this.exitAfterQrFail('retry window expired');
      }
    }, 1000);
  }

  private handleQrGenerateFailed(errorLog?: string, reconnectWs: boolean = false): void {
    this.stopQrGenCountdown();
    clearInterval(this.countdownDestroyTimer);
    this.countdownDestroy = 60;
    this.resetMessage();
    this.isPayment = false;

    if (errorLog) {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: errorLog });
    }
    if (reconnectWs) {
      this.WSAPIService.reconnect();
    }

    // Already showing retry UI (e.g. timeout then late error) — keep current window
    if (this.showQrRetry) {
      return;
    }

    this.showQrRetry = true;
    this.startQrRetryCountdown();
  }

  private exitAfterQrFail(reason: string = 'qr fail exit'): void {
    clearInterval(this.countdownQrRetryTimer);
    this.stopQrGenCountdown();
    clearTimeout(this.pageHardCloseTimer);
    this.showQrRetry = false;
    this.isQrGenerating = false;
    try {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `EXIT QR FAIL: ${reason}` });
    } catch (e) { }
    this.apiService.myTab1.clearStockAfterLAABGo();
    this.close();
    this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
  }





  loadCountDownBillNew(list?: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.countdownBillTimer = setTimeout(async () => {

          // Activate payment UI first — never block on qrlogo (offline can hang logo load)
          try {
            if (this.apiService.cash.value >= this.getTotalSale.t) {
              HmCheckoutDockComponent.btnLAABGo?.classList.add('active');
            }
          } catch (e) { }

          try {
            if (HmCheckoutDockComponent.orderlistElement) {
              this.checkOrders(HmCheckoutDockComponent.orderlistElement);
              HmCheckoutDockComponent.orderlistElement.className = 'order-list fit';
            }
            HmCheckoutDockComponent.laabCardFooter?.classList.add('active');
            this.loadBillWave();
          } catch (e) { }

          // Decorative placeholder QR — must not block payment flow when offline
          try {
            const questqrcode = await Promise.race([
              new qrlogo({ logo: this.questionIcon, content: 'choose any payment method' }).getCanvas(),
              new Promise((_, rej) => setTimeout(() => rej(new Error('quest qr timeout')), 3000))
            ]) as any;
            if (HmCheckoutDockComponent.qrimgElement && questqrcode) {
              HmCheckoutDockComponent.qrimgElement.src = questqrcode.toDataURL();
            }
          } catch (e) {
            console.warn('quest qrlogo skipped', e);
          }

          if (!list) return resolve(await this._processLoopPayment());

          this.paymentmethod = list.value;
          this.paymentText = list.name;
          this.paymentLogo = list.image;
          resolve(await this._processLoopDestroyLastest());

        }, 1000);

      } catch (error:any) {
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

          if (this.apiService.cash.value >= this.getTotalSale.t) {
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

      } catch (error:any) {
        resolve(error.message);
      }
    });
  }




  private _processLoopDestroyLastest(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        let cls: string = `countdownDestroy`;
        this.showQrRetry = false;
        this.isPayment = false;
        const requestId = ++this.qrRequestId;

        console.log('START GENERATE LAOQR');

        // Offline: show retry immediately — do not hang on HTTP / qrlogo
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          this.handleQrGenerateFailed('OFFLINE before Generate QR');
          return resolve(IENMessage.success);
        }

        this.startQrGenCountdown(requestId);

        this.apiService.buyLaoQRQ(this.parseorders, this.parseGetTotalSale.t).then(async rx => {
          if (requestId !== this.qrRequestId) return resolve(IENMessage.success);

          const r = rx.data;
          this.stopQrGenCountdown();
          const response: any = r;

          console.log(`response generate LaoQR`, response);
          if (response.status != 1) {
            this.handleQrGenerateFailed(`ERR Generate QR :${JSON.stringify(response)}`, true);
            return resolve(IENMessage.success);
          }

          const run = response.data;
          console.log('-----> SUCCESS GENERATE:', run);

          const transactionID = run.transactionID;
          localStorage.setItem('transactionID', transactionID);

          // qrlogo with logo can hang offline — fallback to plain QR
          let dataUrl = '';
          try {
            const qrcode = await Promise.race([
              new qrlogo({ logo: this.paymentLogo, content: run.qr }).getCanvas(),
              new Promise((_, rej) => setTimeout(() => rej(new Error('qrlogo timeout')), 5000))
            ]) as any;
            dataUrl = qrcode.toDataURL();
          } catch (e) {
            try {
              const qrcode = await Promise.race([
                new qrlogo({ content: run.qr }).getCanvas(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('qrlogo plain timeout')), 5000))
              ]) as any;
              dataUrl = qrcode.toDataURL();
            } catch (e2) {
              this.handleQrGenerateFailed(`ERROR render QR :${e2}`);
              return resolve(IENMessage.success);
            }
          }

          if (requestId !== this.qrRequestId) return resolve(IENMessage.success);

          this.qrDataUrl = dataUrl;
          if (HmCheckoutDockComponent.qrimgElement) HmCheckoutDockComponent.qrimgElement.src = dataUrl;
          clearInterval(this.countdownQrRetryTimer);
          this.showQrRetry = false;
          this.isQrGenerating = false;
          this.isPayment = true;
          this.billDate = new Date();
          console.log('END GENERATE LAOQR AND SUCCESS');
          console.log('QR CODE :');

          this.countdownDestroyTimer = setInterval(async () => {
            this.countdownDestroy--;

            if (this.countdownDestroy <= 0) {
              clearInterval(this.countdownDestroyTimer);
              this.countdownDestroy = 60;
              if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
              HmCheckoutDockComponent.message = undefined;

              this.apiService.myTab1.clearStockAfterLAABGo();
              this.close();

              setTimeout(() => {
                this.apiService?.myTab1?.loadPaidBills();
              }, 5000);

              return resolve(IENMessage.success);
            } else {
              HmCheckoutDockComponent.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
              if (HmCheckoutDockComponent.messageCount) HmCheckoutDockComponent.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
            }

          }, 1000);


          return resolve(IENMessage.success);
        }, async error => {
          if (requestId !== this.qrRequestId) return resolve(IENMessage.success);
          this.handleQrGenerateFailed(`ERROR Generate QR :${JSON.stringify(error)}`);
          return resolve(IENMessage.success);
        });




      } catch (error:any) {
        this.handleQrGenerateFailed(`CATCH Generate QR :${error?.message || error}`);
        resolve(error.message);
      }
    });
  }


  // checkLastGenQR() {
  //   try {
  //     const lastClick = this.getStoredLastClick();
  //     if (!lastClick) {
  //       console.log('ไม่พบข้อมูล lastClick ใน localStorage');
  //       return false;
  //     }

  //     const targetTime = new Date(lastClick).getTime();

  //     if (isNaN(targetTime)) {
  //       console.error('Invalid date format in storage');
  //       this.clearInvalidLastClick();
  //       return false;
  //     }

  //     const currentTime = new Date().getTime();
  //     const timeDifferenceSeconds = (currentTime - targetTime) / 1000;

  //     // console.log(`เวลาที่บันทึก: ${new Date(targetTime).toLocaleString('th-TH')}`);
  //     // console.log(`เวลาปัจจุบัน: ${new Date(currentTime).toLocaleString('th-TH')}`);
  //     // console.log(`ผ่านมาแล้ว: ${timeDifferenceSeconds.toFixed(2)} วินาที`);

  //     const has30SecondsPassed = timeDifferenceSeconds >= 70;

  //     if (!has30SecondsPassed) {
  //       // console.log(`ผ่านมาแล้ว ${Math.floor(timeDifferenceSeconds)} วินาที (มากกว่า 70 วินาที)`);
  //       this.apiService.alertTimeout('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321');
  //       this.clearInvalidLastClick();
  //       setTimeout(() => {
  //         this.apiService?.myTab1?.loadPaidBills();
  //       }, 10000);
  //     }

  //     return has30SecondsPassed;

  //   } catch (error) {
  //     console.error('Error in checkLastClick:', error);
  //     this.apiService.IndexedLogDB.addBillProcess({
  //       errorData: `Error checkLastClick ${JSON.stringify(error)}`
  //     });
  //     return false;
  //   }
  // }


  // ฟังก์ชันช่วยสำหรับอ่านค่าจาก localStorage
  // private getStoredLastClick(): string | null {
  //   try {
  //     const stored = localStorage.getItem('lastGenQR');
  //     if (!stored) return null;

  //     // ลอง parse เป็น JSON ก่อน
  //     try {
  //       return JSON.parse(stored);
  //     } catch {
  //       // ถ้า parse ไม่ได้ แต่มี quotes ลบออก
  //       if (stored.startsWith('"') && stored.endsWith('"')) {
  //         return stored.slice(1, -1);
  //       }
  //       return stored;
  //     }
  //   } catch (error) {
  //     console.error('Error reading from localStorage:', error);
  //     return null;
  //   }
  // }

  // // ลบข้อมูลที่ไม่ถูกต้อง
  // private clearInvalidLastClick() {
  //   try {
  //     localStorage.removeItem('lastGenQR');
  //     console.log('ลบข้อมูล lastClick ที่ไม่ถูกต้องออกแล้ว');
  //   } catch (error) {
  //     console.error('Error clearing invalid lastClick:', error);
  //   }
  // }

  // // ฟังก์ชันบันทึกเวลา
  // setLastClick() {
  //   try {
  //     const now = new Date().toISOString();
  //     localStorage.setItem('lastGenQR', JSON.stringify(now));
  //     console.log('บันทึกเวลาคลิกแล้ว:', now);
  //   } catch (error) {
  //     console.error('Error setting last click:', error);
  //   }
  // }


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
          if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
          HmCheckoutDockComponent.message = undefined;

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
            if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
            HmCheckoutDockComponent.message = undefined;

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
          HmCheckoutDockComponent.qrimgElement.src = `../../../../assets/logo/scannow.gif`;
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
              if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
              HmCheckoutDockComponent.message = undefined;

              this.apiService.myTab1.clearStockAfterLAABGo();
              this.close();
              this.apiService.alertTimeout('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321');
              return resolve(IENMessage.success);
            } else {
              HmCheckoutDockComponent.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
              if (HmCheckoutDockComponent.messageCount) HmCheckoutDockComponent.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
            }

          }, 1000);


          return resolve(IENMessage.success);
        }, async error => {
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          clearInterval(this.countdownDestroyTimer);
          this.countdownDestroy = 60;
          if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
          HmCheckoutDockComponent.message = undefined;

          this.close();
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
          return resolve(IENMessage.success);
        });




      } catch (error:any) {
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
          if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
          HmCheckoutDockComponent.message = undefined;

          // this.apiService.myTab1.clearStockAfterLAABGo();
          this.close();
          this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາເລືອກ Lao QR ແທນ ຫຼືລອງອີກຄັ້ງໃນພາຍຫຼັງ');
          resolve(IENMessage.success);
        }

        const qrcode = await new qrlogo({ logo: this.paymentLogo, content: run.data[0].qrcode }).getCanvas();
        this.qrDataUrl = qrcode.toDataURL();
        if (HmCheckoutDockComponent.qrimgElement) HmCheckoutDockComponent.qrimgElement.src = this.qrDataUrl;
        this.isPayment = true;
        // this.isLoading = false;
        this.billDate = new Date();
        console.log('END GENERATE Mmoney AND SUCCESS');
        console.log('=====>RUN', run);
        const transactionID = localStorage.getItem('transactionID');
        console.log('QR CODE MMoney:');

        // this._processLoopCheckLaoQRPaid(transactionID);




        // HmCheckoutDockComponent.message = Swal.fire({
        //   position: 'top-end',
        //   html: this.messagetextModel(title, text, cls),
        //   showConfirmButton: false,
        //   heightAuto: false,
        //   backdrop: false
        // });

        // alert('TEST')

        // let checkLAAB: number = 55;


        // loop destroy
        this.countdownDestroyTimer = setInterval(async () => {
          this.countdownDestroy--;


          // console.log(`ERROR SHOULD NOT HERE`);

          if (this.countdownDestroy <= 0) {
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
            HmCheckoutDockComponent.message = undefined;

            this.apiService.myTab1.clearStockAfterLAABGo();
            this.close();
            this.apiService.alertError(IENMessage.timeout);
            resolve(IENMessage.success);
          } else {
            HmCheckoutDockComponent.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
            if (HmCheckoutDockComponent.messageCount) HmCheckoutDockComponent.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
          }

        }, 1000);

      } catch (error:any) {
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
        const previousAmount: number = this.apiService.cash.value;

        this.countdownCheckLAABTimer = setInterval(async () => {
          this.countdownCheckLAAB--;
          if (checkLAAB > -1 && this.countdownCheckLAAB == checkLAAB) {
            checkLAAB -= 5;

            const params = {
              machineId: localStorage.getItem('machineId')
            }

            const run = await this.loadVendingWalletCoinBalanceProcess.Init(params);
            if (run.message != IENMessage.success) throw new Error(run);
            this.apiService.cash.value = run.data[0].vendingWalletCoinBalance;

            if (previousAmount != this.apiService.cash.value) {
              // everytime when balance change stop loop and stop find laab
              clearInterval(this.countdownCheckLAABTimer);
              checkLAAB - 1;
              console.log(`LAAB CASHIN balance ${this.apiService.cash.value} amount ${this.parseGetTotalSale.t}`);
              this.apiService.soundLaabIncreased();
              // HmCheckoutDockComponent.laabqrimgElement.classList.remove('active');
              HmCheckoutDockComponent.btnLAABGo.classList.add('active');
              await this.laabAutoCashin();

            } else {
              console.log(`LAAB CASH NOT ENOUGHT balance ${this.apiService.cash.value} amount ${this.parseGetTotalSale.t}`);
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

      } catch (error:any) {
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
        this.paymentmethod = '';

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

      } catch (error:any) {
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

        this.apiService.myTab1.refreshBalanceFromAnotherModal(Number(this.apiService.cash.value) - Number(this.getTotalSale.t));
        this.apiService.myTab1.clearCart();
        this.close();

        resolve(IENMessage.success);

      } catch (error:any) {
        resolve(error.message);
      }
    });
  }



  choosePaymentMethod(list: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.paymentmethod = list.value;
        this.isPayment = false;
        this.showQrRetry = false;
        this.qrRetryCount = 0;
        clearInterval(this.countdownQrRetryTimer);
        this.qrRequestId++;
        // this.isLoading = true;

        if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
        HmCheckoutDockComponent.message = undefined;

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
        else if (this.paymentmethod == IPaymentMethod.cash) {
          this.paymentText = 'Cash';
          // resolve(await this._processLoopDestroyCash());
          resolve(IENMessage.success);
        }
        else {

        }

        // resolve(await this._processLoopDestroyNew());


      } catch (error:any) {

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
            if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
            HmCheckoutDockComponent.message = undefined;

            // this.apiService.myTab1.clearStockAfterLAABGo();
            this.apiService.myTab1.clearCart();
            this.close();
            this.apiService
              .showModal(RemainingbilllocalPage, { r: this.apiService.pb, serial: this.apiService.myTab1.serial }, false)
              .then((r) => {
                r?.present();
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
      } catch (error:any) {

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
      } catch (error:any) {

        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
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
    if (HmCheckoutDockComponent.message) HmCheckoutDockComponent.message.close();
    HmCheckoutDockComponent.message = undefined;
  }



  refreshOrder() {
    const local = this.apiService.myTab1?.localLoad?.() || {
      orders: this.orders || [],
      sum: this.getTotalSale || { q: 0, t: 0 },
    };
    this.parseorders = local.orders;
    this.parseGetTotalSale = local.sum;
    this.orders = local.orders;
    this.getTotalSale = local.sum;
  }

  private checkOrders(orderlistElement: HTMLDivElement) {
    if (!orderlistElement) return;
    const n = Object.entries(this.orders || {}).length;
    if (n <= 7) orderlistElement.classList.add('order-7');
    else if (n <= 11) orderlistElement.classList.add('order-11');
    else if (n <= 15) orderlistElement.classList.add('order-15');
    else orderlistElement.classList.add('order-19');
  }

  loadDOMs() {
    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      HmCheckoutDockComponent.orderlistElement = document.querySelector(
        '.order-list, .dock__cart',
      ) as HTMLDivElement;
      HmCheckoutDockComponent.laabCardFooter = document.querySelector(
        '.laab-card-footer, .dock__pay',
      ) as HTMLDivElement;
      HmCheckoutDockComponent.billWaveElement = document.querySelector('.bill-wave') as HTMLDivElement;
      HmCheckoutDockComponent.qrimgElement = document.querySelector('#qr-img') as HTMLImageElement;
      HmCheckoutDockComponent.btnLAABGo = document.querySelector('#btn-laab-go') as HTMLHRElement;
      HmCheckoutDockComponent.laabqrimgElement = document.querySelector(
        '#laab-qr-img',
      ) as HTMLImageElement;
      HmCheckoutDockComponent.ionbackdropElement = document.querySelectorAll(
        'ion-backdrop',
      ) as NodeListOf<HTMLIonBackdropElement>;
      this.checkOrders(HmCheckoutDockComponent.orderlistElement);
    });
  }
















private onIdle() {
  this.clearCartOnly();
  this.openAds();
}










private qrDebounce: any;
private idleTimer: any;
private qrAbort: AbortController | null = null;
readonly idleMs = 5 * 60 * 1000;

photoOf(order: any, size = 96): string {
  const id = order?.stock?.image;
  if (!id) return '';
  const cached = this.apiService?.imageList?.[id];
  if (typeof cached === 'string' && cached.startsWith('data:image')) return cached;
  if (typeof cached === 'string' && cached.startsWith('http')) return cached;
  return downloadPhotoUrl(id, size, size);
}

onPhotoError(ev: Event, order: any): void {
  const img = ev.target as HTMLImageElement;
  if (!img) return;
  const id = order?.stock?.image;
  if (id && img.dataset['step'] !== '1') {
    img.dataset['step'] = '1';
    img.src = downloadPhotoUrl(id, 64, 64);
  }
}

ngOnChanges(changes: SimpleChanges): void {
  if (!changes['orders'] && !changes['getTotalSale']) return;
  this.invalidateQr();
  this.scheduleGenerate();
  this.bumpIdle();
}

removeOrder(index: number) {
  this.removeAt.emit(index);
}

clearCartOnly() {
  this.invalidateQr();
  this.qrDataUrl = '';
  this.isPayment = false;
  this.isQrGenerating = false;
  this.showQrRetry = false;
  this.cartCleared.emit();
}

invalidateQr() {
  this.qrRequestId++;
  try {
    this.qrAbort?.abort();
  } catch {}
  this.qrAbort = new AbortController();
  clearTimeout(this.qrDebounce);
}

scheduleGenerate() {
  if (!this.getTotalSale?.q || !this.getTotalSale?.t) {
    this.qrDataUrl = '';
    this.isQrGenerating = false;
    this.isPayment = false;
    return;
  }
  this.isQrGenerating = true;
  this.showQrRetry = false;
  const requestId = this.qrRequestId;
  const signal = this.qrAbort?.signal;
  this.qrDebounce = setTimeout(() => this.generateLaoQr(requestId, signal), 120);
}

retryGenerateQr() {
  this.qrRetryCount++;
  this.invalidateQr();
  this.scheduleGenerate();
}

private generateLaoQr(requestId: number, signal?: AbortSignal) {
  if (requestId !== this.qrRequestId || signal?.aborted) return;
  this.isQrGenerating = true;
  this.showQrRetry = false;
  const orders = this.orders;
  const total = this.getTotalSale.t;
  this.apiService
    .buyLaoQRQ(orders, total)
    .then(async (rx) => {
      if (requestId !== this.qrRequestId || signal?.aborted) return;
      const response: any = rx?.data;
      if (response?.status != 1 || !response?.data?.qr) {
        this.showQrRetry = true;
        this.isQrGenerating = false;
        return;
      }
      const run = response.data;
      localStorage.setItem('transactionID', run.transactionID);
      try {
        const canvas: any = await Promise.race([
          new qrlogo({ content: run.qr }).getCanvas(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
        ]);
        if (requestId !== this.qrRequestId || signal?.aborted) return;
        this.qrDataUrl = canvas.toDataURL();
        this.isPayment = true;
        this.isQrGenerating = false;
      } catch {
        if (requestId !== this.qrRequestId) return;
        this.showQrRetry = true;
        this.isQrGenerating = false;
      }
    })
    .catch(() => {
      if (requestId !== this.qrRequestId || signal?.aborted) return;
      this.showQrRetry = true;
      this.isQrGenerating = false;
    });
}

bumpIdle() {
  clearTimeout(this.idleTimer);
  this.idleTimer = setTimeout(() => this.clearCartOnly(), this.idleMs);
}

openAds() {
  this.idleService?.closeAds?.();
}
}

enum IPaymentMethod {
  cash = 'cash',
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
  private paymentmethod: string='';

  // props
  refund: number = 0;
  qrcode: string ='';


  constructor(
    apiService: ApiService,
    vendingAPIService: VendingAPIService,
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

      } catch (error:any) {
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

      } catch (error:any) {
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
          amount: this.apiService.cash.value
        }
        const run = await new LAABPayment(this.apiService, this.vendingAPIService).Init(params);
        console.log(`LAABPayment`, run);
        if (run.message != IENMessage.success) throw new Error(run);

        this.refund = run.data[0].refund;

        resolve(IENMessage.success);

      } catch (error:any) {
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

      } catch (error:any) {
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

      } catch (error:any) {
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
  private amount: number=-1;

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

      } catch (error:any) {
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

      } catch (error:any) {
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
  private qrcode: string='';

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

      } catch (error :any) {
        resolve(error.message);
      }
    });
  }

  public CheckLaoQRPaid(): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
      try {
        const run = await this.generateLaoQRCodeProcess.CheckLaoQRPaid();
        resolve(run);
      } catch (error :any) {
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

      } catch (error :any) {
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
  private qrcode: string='';

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

      } catch (error:any) {
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

      } catch (error:any) {
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



  /**
 * Replace removeOrder + refreshOrder + checkOrders in HmCheckoutDockComponent.
 * The crash is: orderlistElement is null (dock template has no .order-list).
 */










}