import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AutoPaymentPage } from '../tab1/Vending/auto-payment/auto-payment.page';
import { IENMessage } from '../models/base.model';
import { GenerateMMoneyQRCodeProcess } from '../tab1/MMoney_processes/generateMMoneyQRCode.process';
import { VendingAPIService } from '../services/vending-api.service';
import { ApiService } from '../services/api.service';
import { EClientCommand, EMessage, IMachineId, IVendingMachineSale } from '../services/syste.model';
import { GenerateLaoQRCodeProcess } from '../tab1/LaoQR_processes/generateLaoQRCode.process';
import { PaidValidationProcess } from '../tab1/LAAB_processes/paidValidation.process';
import { LoadVendingWalletCoinBalanceProcess } from '../tab1/LAAB_processes/loadVendingWalletCoinBalance.process';
import { WsapiService } from '../services/wsapi.service';
import { AlertController, ModalController } from '@ionic/angular';
import * as cryptojs from 'crypto-js';
import qrlogo from 'qrcode-with-logos';
import { RemainingbilllocalPage } from '../remainingbilllocal/remainingbilllocal.page';
import { CustomNumberPadPage } from '../custom-number-pad/custom-number-pad.page';


@Component({
  selector: 'app-auto-payment-top-up',
  templateUrl: './auto-payment-top-up.page.html',
  styleUrls: ['./auto-payment-top-up.page.scss'],
})
export class AutoPaymentTopUpPage implements OnInit, OnDestroy {

  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;

  @Input() orders: Array<any> = [];
  @Input() getTotalSale: any;
  @Input() currentBalance: { value: number, currency: string } = { value: 0, currency: 'LAK' };

  contact = localStorage.getItem('contact') || '55516321';

  // @Input() serial: ISerialService;

  public pic_playstore = '../../assets/images/playstoredownload.png';
  public pic_qr_android = '../../assets/logo/laab_android.png';
  public pic_appstore = '../../assets/images/icon-appstore-download.png';
  public pic_qr_ios = '../../assets/logo/laab_ios.png';


  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  videos: string[] = [
    '../../assets/videos/promotion.mp4'
  ];

  currentIndex = 0;


  parseorders: Array<any> = [];
  defaultPhone: string = '55516321';
  parseGetTotalSale: any = {} as any;

  lists: Array<any> = [];
  drawCircle: Array<any> = [];
  billDate: Date;
  paymentmethod: string = '';
  paymentText: string = '';
  paymentLogo: string = '';
  isPayment: boolean = false;
  cashStatus: any = {};

  isEnoughCash: boolean = false;
  isProcessing: boolean = false;
  cashBalanceInterval: any = null;
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
  private lastQrPhone: string = '';


  laabIcon: string = `../../../../assets/logo/LAAB-logo.png`;
  questionIcon: string = `../../../../assets/logo/question-logo.png`;
  banner = '../../assets/topup/bannertopup.jpeg';

  _style = {
    'background-image': 'url(' + this.banner + ')',
    'background-size': 'contain', // or '50%', 'auto 80%', etc.
    'background-position': 'center',
    // 'filter': 'blur(5px)'
    // 'background-repeat': 'no-repeat' // Add this to prevent tiling
  }
  // DOMS
  static orderlistElement: HTMLDivElement;
  static messageCount: HTMLDivElement;
  static laabCardFooter: HTMLDivElement;
  static qrimgElement: HTMLImageElement;

  static countdownPaymentElement: HTMLDivElement;
  static autoPaymentPageElement: HTMLIonContentElement;
  static laabqrimgElement: HTMLImageElement;


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

  isOpenPhonePad: boolean = false;


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


  bankList: Array<any> = [];


  paymentList: Array<any> = [];
  paymentOptions: Array<any> = [...this.ewalletOptionList];

  paymentCheck: Array<any> = [...this.ewalletCheckList];
  phone: string = '';


  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;

  machineId = {} as IMachineId;


  constructor(
    public apiService: ApiService,

    public vendingAPIService: VendingAPIService,
    public WSAPIService: WsapiService,
    public alertController: AlertController



  ) {
    // this.apiService.___AutoPaymentPage = this.modal;

    this.loadVendingWalletCoinBalanceProcess = new LoadVendingWalletCoinBalanceProcess(this.apiService, this.vendingAPIService);
    this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);

  }

  ngAfterViewInit() {


    const player = this.videoPlayer?.nativeElement;

    // set first video
    player.src = this.videos[this.currentIndex];
    player.play();

    // when one video ends, play the next
    player.onended = () => {
      this.currentIndex = (this.currentIndex + 1) % this.videos.length;
      player.src = this.videos[this.currentIndex];
      player.play();
    };
  }

  async ngOnInit() {

    this.machineId = this.apiService.machineId;

    this.bankList.push(...[
      {
        image: `../../../../assets/logo/laoqr.png`,
        name: 'Lao QR',
        title: 'Lao QR (optional)',
        detail: 'Pay your orders by using Lao QR One QRCode',
        value: 'LaoQR'
      }

    ]);
    if (this.apiService.isQrPayment) {
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
      if (this.apiService.allowCashIn) {
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


    this.refreshOrder();



    console.log(`order der`, this.parseorders);
    console.log(`--->`, this.parseGetTotalSale);
    console.log('paymentList', this.paymentList);



    this.loadDOMs();

    // websocket check when process callback
    this.apiService.onDelivery(res_delivery => {
      this.orders = [];
      this.getTotalSale.q = 0;
      this.getTotalSale.t = 0;
      this.apiService.myTab1.clearCart();
      this.close();
    });

    // Absolute safety: this modal must never stay open forever on a vending machine
    this.startPageHardClose();

    await this.loadCountDownBillNew();


  }



  openCustomNumpad() {
    try {
      this.apiService.showModal(CustomNumberPadPage, {}, false, 'dialog-showNumber').then(r => {
        r?.present().then(rP => {
          this.isOpenPhonePad = true;
        });
        r?.onDidDismiss().then(rD => {
          // console.log('---->PHONEPAD', rD?.data?.data?.phonenumber)
          this.isOpenPhonePad = false;
          if (rD?.data?.data?.phonenumber) {
            // console.log('-----> PHONE', rD?.data?.phonenumber);
            this.phone = rD?.data?.data?.phonenumber;
            clearInterval(this.countdownDestroyTimer);
            clearInterval(this.countdownQrRetryTimer);
            this.countdownDestroy = 60;
            this.showQrRetry = false;
            this.qrRetryCount = 0;
            this._processLoopDestroyLastest(this.phone);
          }
        })
      });
    } catch (error: any) {
      this.isOpenPhonePad = false;
    }
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
    this.clearAllTimers();
    clearTimeout(this.pageHardCloseTimer);

  }

  loadDOMs() {
    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      AutoPaymentPage.orderlistElement = (document.querySelector('.order-list') as HTMLDivElement);
      AutoPaymentPage.laabCardFooter = (document.querySelector('.laab-card-footer') as HTMLDivElement);
      AutoPaymentPage.qrimgElement = (document.querySelector('#qr-img') as HTMLImageElement);
      this.checkOrders(AutoPaymentPage.orderlistElement);
    });
  }


  close() {
    this.resetMessage();
    this.clearAllTimers();           // ← One line, clean!
    clearTimeout(this.pageHardCloseTimer);
    this.showQrRetry = false;
    this.isQrGenerating = false;
    console.log('----->isOpenPhonePad :', this.isOpenPhonePad);
    this.apiService.dismissAllModals();
  }

  /** Customer taps QR area to retry generate after fail/timeout */
  retryGenerateQr(): void {
    if (!this.showQrRetry) return;
    // Unlimited retries — page still always closes via retry window / hard close
    clearInterval(this.countdownQrRetryTimer);
    this.showQrRetry = false;
    this.qrRetryCount++;
    this._processLoopDestroyLastest(this.lastQrPhone || this.phone || this.defaultPhone);
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

    if (this.isOpenPhonePad) {
      this.apiService.closeModal();
    }

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
    if (this.isOpenPhonePad) {
      this.apiService.closeModal();
    }
    try {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `EXIT QR FAIL: ${reason}` });
    } catch (e) { }
    this.apiService.myTab1.clearStockAfterLAABGo();
    this.close();
    this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
  }


  async autoSubmit(form: any, phoneInput: HTMLInputElement) {

    if (this.phone?.length === 8 && form.valid) {
      phoneInput.blur();
      clearInterval(this.countdownDestroyTimer);
      this.countdownDestroy = 60;
      this._processLoopDestroyLastest(this.phone);

      // await this.loadCountDownBillNew();
      // this.selldelivery();
    }
  }


  loadCountDownBillNew(list?: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.countdownBillTimer = setTimeout(async () => {

          // Activate payment UI first — never block on qrlogo (offline can hang logo load)
          try {
            if (AutoPaymentPage.orderlistElement) {
              this.checkOrders(AutoPaymentPage.orderlistElement);
              AutoPaymentPage.orderlistElement.className = 'order-list fit';
            }
            AutoPaymentPage.laabCardFooter?.classList.add('active');
            this.loadBillWave();
          } catch (e) { }

          if (this.currentBalance.value >= this.getTotalSale.t) {
            this.paymentmethod = IPaymentMethod.cash;
            this.paymentText = this.paymentList.find(v => v.value === IPaymentMethod.cash)?.name;
            this.paymentLogo = this.paymentList.find(v => v.value === IPaymentMethod.cash)?.image;
            this._processLoopDestroyCash();
            return resolve(IENMessage.success);
          }

          // Decorative placeholder — must not block when offline
          try {
            const questqrcode = await Promise.race([
              new qrlogo({ logo: this.questionIcon, content: 'choose any payment method' }).getCanvas(),
              new Promise((_, rej) => setTimeout(() => rej(new Error('quest qr timeout')), 3000))
            ]) as any;
            if (AutoPaymentPage.qrimgElement && questqrcode) {
              AutoPaymentPage.qrimgElement.src = questqrcode.toDataURL();
            }
          } catch (e) {
            console.warn('quest qrlogo skipped', e);
          }

          if (!list) return resolve(await this._processLoopPayment());
          this.paymentmethod = list.value;
          this.paymentText = list.name;
          this.paymentLogo = list.image;
          resolve(await this._processLoopDestroyLastest(this.defaultPhone));
        }, 1000);

      } catch (error: any) {
        resolve(error.message);
      }
    });
  }

  private _processLoopPayment(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        // loop generate
        this.countdownPaymentTimer = setTimeout(async () => {


          this.paymentmethod = IPaymentMethod.LaoQR;
          this.paymentText = this.paymentList.find(v => v.value === IPaymentMethod.LaoQR)?.name;
          this.paymentLogo = this.paymentList.find(v => v.value === IPaymentMethod.LaoQR)?.image;
          this._processLoopDestroyLastest(this.defaultPhone);

        }, 1000);

      } catch (error: any) {
        resolve(error.message);
      }
    });
  }




  private _processLoopDestroyLastest(phone?: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        console.log('-----> START GEN QR');

        let cls: string = `countdownDestroy`;
        this.showQrRetry = false;
        this.isPayment = false;
        this.lastQrPhone = phone || this.phone || this.defaultPhone;
        const requestId = ++this.qrRequestId;

        console.log('START GENERATE LAOQR');

        // Offline: show retry immediately — do not hang on HTTP / qrlogo
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          this.handleQrGenerateFailed('OFFLINE before Generate QR');
          return resolve(IENMessage.success);
        }

        this.startQrGenCountdown(requestId);

        this.apiService.buyLaoQRQ(this.parseorders, this.parseGetTotalSale.t, this.lastQrPhone).then(async rx => {
          if (requestId !== this.qrRequestId) return resolve(IENMessage.success);

          const r = rx.data;
          this.stopQrGenCountdown();
          const response: any = r;

          console.log(`response generate LaoQR`, response);
          if (response.status != 1) {
            this.clearInvalidLastClick();
            this.handleQrGenerateFailed(`ERR Generate QR :${JSON.stringify(response)}`, true);
            return resolve(IENMessage.success);
          }
          this.setLastClick();
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

          if (AutoPaymentPage.qrimgElement) AutoPaymentPage.qrimgElement.src = dataUrl;
          clearInterval(this.countdownQrRetryTimer);
          this.showQrRetry = false;
          this.isQrGenerating = false;
          this.isPayment = true;
          this.billDate = new Date();
          console.log('END GENERATE LAOQR AND SUCCESS');

          this.countdownDestroyTimer = setInterval(async () => {
            this.countdownDestroy--;

            if (this.countdownDestroy <= 0) {
              clearInterval(this.countdownDestroyTimer);
              this.countdownDestroy = 60;
              if (AutoPaymentPage.message) AutoPaymentPage.message.close();
              AutoPaymentPage.message = undefined;

              this.apiService.myTab1.clearStockAfterLAABGo();
              if (this.isOpenPhonePad) {
                console.log('-----> DISMISS MODEL');
                this.apiService.dismissModal();

              }
              this.close();
              this.checkLastGenQR();
              return resolve(IENMessage.success);
            } else {
              AutoPaymentPage.messageCount = (document.querySelector(`#${cls}`) as HTMLDivElement);
              if (AutoPaymentPage.messageCount) AutoPaymentPage.messageCount.textContent = `System will destroy all order and qrcode in ${this.countdownDestroy}`;
            }

          }, 1000);


          return resolve(IENMessage.success);
        }, async error => {
          if (requestId !== this.qrRequestId) return resolve(IENMessage.success);
          this.handleQrGenerateFailed(`ERROR Generate QR :${JSON.stringify(error)}`);
          return resolve(IENMessage.success);
        });




      } catch (error: any) {
        this.handleQrGenerateFailed(`CATCH Generate QR :${error?.message || error}`);
        resolve(error.message);
      }
    });
  }


  checkLastGenQR() {
    try {
      const lastClick = this.getStoredLastClick();
      if (!lastClick) {
        console.log('ไม่พบข้อมูล lastClick ใน localStorage');
        return false;
      }

      const targetTime = new Date(lastClick).getTime();

      if (isNaN(targetTime)) {
        console.error('Invalid date format in storage');
        this.clearInvalidLastClick();
        return false;
      }

      const currentTime = new Date().getTime();
      const timeDifferenceSeconds = (currentTime - targetTime) / 1000;

      // console.log(`เวลาที่บันทึก: ${new Date(targetTime).toLocaleString('th-TH')}`);
      // console.log(`เวลาปัจจุบัน: ${new Date(currentTime).toLocaleString('th-TH')}`);
      // console.log(`ผ่านมาแล้ว: ${timeDifferenceSeconds.toFixed(2)} วินาที`);

      const has30SecondsPassed = timeDifferenceSeconds >= 70;

      if (!has30SecondsPassed) {
        // console.log(`ผ่านมาแล้ว ${Math.floor(timeDifferenceSeconds)} วินาที (มากกว่า 70 วินาที)`);
        this.apiService.alertTimeout('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321\n\n如果您已经完成付款，请等待30秒以领取您的商品。  如有问题，请联系客服电话：020-5551-6321');
        this.clearInvalidLastClick();
        setTimeout(() => {
          this.apiService?.myTab1?.loadPaidBills();
        }, 10000);
      }

      return has30SecondsPassed;

    } catch (error: any) {
      console.error('Error in checkLastClick:', error);
      this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error checkLastClick ${JSON.stringify(error)}`
      });
      return false;
    }
  }

  // ฟังก์ชันช่วยสำหรับอ่านค่าจาก localStorage
  private getStoredLastClick(): string | null {
    try {
      const stored = localStorage.getItem('lastGenQR');
      if (!stored) return null;

      // ลอง parse เป็น JSON ก่อน
      try {
        return JSON.parse(stored);
      } catch {
        // ถ้า parse ไม่ได้ แต่มี quotes ลบออก
        if (stored.startsWith('"') && stored.endsWith('"')) {
          return stored.slice(1, -1);
        }
        return stored;
      }
    } catch (error: any) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // ลบข้อมูลที่ไม่ถูกต้อง
  private clearInvalidLastClick() {
    try {
      localStorage.removeItem('lastGenQR');
      console.log('ลบข้อมูล lastClick ที่ไม่ถูกต้องออกแล้ว');
    } catch (error: any) {
      console.error('Error clearing invalid lastClick:', error);
    }
  }

  // ฟังก์ชันบันทึกเวลา
  setLastClick() {
    try {
      const now = new Date().toISOString();
      localStorage.setItem('lastGenQR', JSON.stringify(now));
      console.log('บันทึกเวลาคลิกแล้ว:', now);
    } catch (error: any) {
      console.error('Error setting last click:', error);
    }
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




      } catch (error: any) {
        // this.apiService.alertError(error.message);

        // when choose payment method and it does not work this process will auto loop check laab balance
        const transactionID = localStorage.getItem('transactionID');
        // this._processLoopCheckLaoQRPaid(transactionID ?? '');;
        // this._processLoopPayment();

        resolve(error.message);
      }
    });
  }


  private _processLoopDestroyLAABX(): Promise<any> {
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

        this.apiService.buyLAABX(this.parseorders, this.parseGetTotalSale.t).then(async rx => {
          const r = rx.data;
          clearInterval(this.countdownCheckGenQrResTimer);
          // (await this.workload).dismiss();
          const response: any = r;

          console.log(`----->response generate LAABX`, response);
          if (response.status != 1) {
            this.clearInvalidLastClick();
            clearInterval(this.countdownDestroyTimer);
            this.countdownDestroy = 60;
            if (AutoPaymentPage.message) AutoPaymentPage.message.close();
            AutoPaymentPage.message = undefined;

            // this.apiService.myTab1.clearStockAfterLAABGo();
            this.close();
            this.apiService.alertError('ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
            return resolve(IENMessage.success);

          }
          this.setLastClick();

          const run = response.data;
          console.log('-----> SUCCESS GENERATE:', run);



          const transactionID = run.transactionID;



          localStorage.setItem('transactionID', transactionID);
          const dataQR = {
            emv: run.qr
          };

          const qrcode = await new qrlogo({ logo: this.paymentLogo, content: JSON.stringify(dataQR) }).getCanvas();
          AutoPaymentPage.qrimgElement.src = qrcode.toDataURL();

          // const qrcode = await new qrlogo({ logo: this.paymentLogo, content: run.qr }).getCanvas();
          // AutoPaymentPage.qrimgElement.src = `../../../../assets/logo/scannow.gif`;
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
              this.checkLastGenQR();
              // this.apiService.alertTimeout('ຖ້າຫາກທ່ານໄດ້ຈ່າຍເງິນໄປແລ້ວ ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີເພື່ອຮັບເຄື່ອງ.\nຫຼືຕິດຕໍ່ Call Center: 020-5551-6321\n\nIf you have already made the payment, please wait 30 seconds to receive your product.\nOr contact Call Center: 020-5551-6321');
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




      } catch (error: any) {
        // this.apiService.alertError(error.message);

        // when choose payment method and it does not work this process will auto loop check laab balance
        const transactionID = localStorage.getItem('transactionID');
        // this._processLoopCheckLaoQRPaid(transactionID ?? '');;
        // this._processLoopPayment();

        resolve(error.message);
      }
    });
  }
  private _processLoopDestroyCash(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.paymentmethod = 'cash';           // use string
        this.paymentText = 'Cash';
        this.isPayment = true;
        this.billDate = new Date();

        this.clearAllTimers();

        // Start checking inserted cash every second
        this.startCashBalanceChecker();

        return resolve(IENMessage.success);

      } catch (error: any) {
        console.error(error);
        this.apiService.alertError('Cash payment error');
        resolve(error.message);
      }
    });
  }
  // ==================== CASH PAYMENT HELPERS ====================

  private startCashBalanceChecker() {
    if (this.cashBalanceInterval) clearInterval(this.cashBalanceInterval);

    this.cashBalanceInterval = setInterval(() => {
      this.checkCashBalanceAndUpdateUI();
    }, 1000);
  }

  private checkCashBalanceAndUpdateUI() {
    const total = this.parseGetTotalSale?.t || 0;
    const inserted = this.currentBalance?.value || 0;
    this.isEnoughCash = inserted >= total;
  }

  public async confirmCashPayment() {
    const total = this.parseGetTotalSale?.t || 0;
    const inserted = this.currentBalance?.value || 0;

    if (inserted < total) {
      this.apiService.alertError('Not enough cash inserted yet!');
      return;
    }

    // Create confirmation alert manually
    const alert = await this.alertController.create({
      header: 'Confirm Cash Payment',
      message: `
            <strong>Total Amount:</strong> ${total} ${this.currentBalance.currency}<br>
            <strong>Cash Inserted:</strong> ${inserted} ${this.currentBalance.currency}<br><br>
            Do you want to complete this payment?
        `,
      cssClass: 'cash-confirm-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'PAY NOW',
          handler: () => {
            this.processSuccessfulCashPayment(total, inserted);
          }
        }
      ]
    });

    await alert.present();
  }

  private processSuccessfulCashPayment(total: number, inserted: number) {
    this.clearAllTimers();
    this.isProcessing = true;

    setTimeout(() => {
      this.apiService.myTab1.clearStockAfterLAABGo();
      this.close();

      // const change = inserted - total;
      this.currentBalance.value -= total;
      // this.apiService.alertSuccess(`Payment Successful!\nChange: ${change} ${this.currentBalance.currency}`);
    }, 800);
  }


  private clearAllTimers() {
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
    // NOTE: do NOT clear pageHardCloseTimer here — hard close must survive payment method switches

    this.resetCountDownBillTimer();
    this.resetCountDownPaymentTimer();
    this.resetCountDownDestroyTimer();
    this.resetCountDownCheckLAABTimer();
    this.resetCountDownLAABDestroyTimer();

    // Cash payment timer
    if (this.cashBalanceInterval) {
      clearInterval(this.cashBalanceInterval);
      this.cashBalanceInterval = null;
    }
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

      } catch (error: any) {
        resolve(error.message);
      }
    });
  }
  // not loop check destroy only



  removeOrder(index: number) {
    this.parseorders.splice(index, 1);
    // this.getSummarizeOrder();

    this.apiService.myTab1.removeCart(index);
    this.refreshOrder();


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
      this.showQrRetry = false;
      this.qrRetryCount = 0;
      // this.isLoading = true;
      this.paymentText = '';
      this.paymentmethod = '';

      // hidden payment
      this.clearAllTimers();

      this.countdownBill = 1;
      this.loadCountDownBillNew();
    }

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

        if (AutoPaymentPage.message) AutoPaymentPage.message.close();
        AutoPaymentPage.message = undefined;

        this.clearAllTimers();

        this.paymentmethod = list.value;
        this.paymentLogo = list.image;
        console.log('=====>paymentmethod', this.paymentmethod);
        console.log('=====>paymentLogo', this.paymentLogo);

        if (this.paymentmethod == IPaymentMethod.mmoney) {
          this.paymentText = 'MMoney';
          resolve(await this._processLoopDestroy());
          // resolve(IENMessage.success);
        } else if (this.paymentmethod == IPaymentMethod.LaoQR) {
          console.log('LAOQR');

          this.paymentText = 'Lao QR';
          resolve(await this._processLoopDestroyLastest(this.defaultPhone));
          // resolve(IENMessage.success);
        } else if (this.paymentmethod == IPaymentMethod.popupQR) {
          this.paymentText = 'Popup QR';
          resolve(await this._processLoopDestroyPopupQR());
          // resolve(IENMessage.success);
        }
        else if (this.paymentmethod == IPaymentMethod.laab) {
          this.paymentText = 'LAABX';
          console.log('LAABX');

          resolve(await this._processLoopDestroyLAABX());
          // resolve(IENMessage.success);
        }
        else if (this.paymentmethod == IPaymentMethod.cash) {
          this.paymentText = 'Cash';
          resolve(await this._processLoopDestroyCash());
          // resolve(IENMessage.success);
        }
        else {

        }


      } catch (error: any) {

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
      } catch (error: any) {

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
      } catch (error: any) {

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
  cash = 'cash',
  laab = 'LAABX',
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
  private paymentmethod: string = '';

  // props
  refund: number = 0;
  qrcode: string = '';


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

      } catch (error: any) {
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

      } catch (error: any) {
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

      } catch (error: any) {
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

      } catch (error: any) {
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
  private amount: number = 0;

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

      } catch (error: any) {
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

      } catch (error: any) {
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
  private qrcode: string = '';

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

      } catch (error: any) {
        resolve(error.message);
      }
    });
  }

  public CheckLaoQRPaid(): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
      try {
        const run = await this.generateLaoQRCodeProcess.CheckLaoQRPaid();
        resolve(run);
      } catch (error: any) {
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

  //     } catch (error:any) {
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

      } catch (error: any) {
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
  private qrcode: string = '';

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

      } catch (error: any) {
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

  //     } catch (error:any) {
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

      } catch (error: any) {
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