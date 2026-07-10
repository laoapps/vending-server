import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ApiService } from '../services/api.service';
import {
  addLogMessage,
  EClientCommand,
  EMACHINE_COMMAND,
  ESerialPortType,
  IBillProcess,
  ICreditData,
  IlogSerial,
  IMachineClientID,
  IMachineId,
  IMMoneyQRRes,
  ISerialService,
  IStock,
  IVendingMachineBill,
  IVendingMachineSale,
  machineVMCStatus,
} from '../services/syste.model';
import { LoadingController, ModalController, Platform } from '@ionic/angular';
// import { BarcodeScanner, BarcodeScannerOptions } from "@ionic-native/barcode-scanner/ngx";
import { QrpayPage } from '../qrpay/qrpay.page';
import qrlogo from 'qrcode-with-logos';
import { StocksalePage } from '../stocksale/stocksale.page';
import { IonicStorageService } from '../ionic-storage.service';
import { CachingService } from '../services/caching.service';
import { environment } from 'src/environments/environment';
import { ShowcartPage } from '../showcart/showcart.page';

import { VendingAPIService } from '../services/vending-api.service';
import { LoadVendingWalletCoinBalanceProcess } from './LAAB_processes/loadVendingWalletCoinBalance.process';
import { IENMessage, ITabVendingSegement, IWebviewTabs } from '../models/base.model';
import { CashValidationProcess } from './LAAB_processes/cashValidation.process';
import { CashinValidationProcess } from './LAAB_processes/cashinValidation.process';
import { LaabGoPage } from './LAAB/laab-go/laab-go.page';
import { EpinCashOutPage } from './LAAB/epin-cash-out/epin-cash-out.page';
import cryptojs from 'crypto-js';

import { RemainingbillsPage } from '../remainingbills/remainingbills.page';
import * as QRCode from 'qrcode';
import { LaabCashinShowCodePage } from './LAAB/laab-cashin-show-code/laab-cashin-show-code.page';
import { LaabCashoutPage } from './LAAB/laab-cashout/laab-cashout.page';
import { WsapiService } from '../services/wsapi.service';
import { IMachineStatus } from '../services/service';
import { HowtoPage } from '../howto/howto.page';
import { StackCashoutPage } from './LAAB/stack-cashout/stack-cashout.page';
import { EpinShowCodePage } from './LAAB/epin-show-code/epin-show-code.page';
import { MmoneyIosAndroidDownloadPage } from './MMoney/mmoney-ios-android-download/mmoney-ios-android-download.page';
import { SettingControlMenuPage } from '../setting/pages/setting-control-menu/setting-control-menu.page';
import { ControlMenuService } from '../services/control-menu.service';
import { TopupAndServicePage } from './Vending/topup-and-service/topup-and-service.page';
import { VendingGoPage } from './Vending/vending-go/vending-go.page';
import { HowtoPageModule } from '../howto/howto.module';
import { HowToPage } from './Vending/how-to/how-to.page';
import { LoadStockListProcess } from './Vending_processes/loadStockList.process';
import { AppcachingserviceService } from '../services/appcachingservice.service';
// import Swal from 'sweetalert2';
// import { AdsPage } from '../ads/ads.page';
import { HangmiStoreSegmentPage } from './VendingSegment/hangmi-store-segment/hangmi-store-segment.page';
import { HangmiFoodSegmentPage } from './VendingSegment/hangmi-food-segment/hangmi-food-segment.page';
import { TopupAndServiceSegmentPage } from './VendingSegment/topup-and-service-segment/topup-and-service-segment.page';
import { PlayGamesPage } from './Vending/play-games/play-games.page';
import { OrderCartPage } from './Vending/order-cart/order-cart.page';
// import { ScreenBrightness } from '@capacitor-community/screen-brightness';

var host = window.location.protocol + '//' + window.location.host;
// import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { AutoPaymentPage } from './Vending/auto-payment/auto-payment.page';
import { TestmotorPage } from '../testmotor/testmotor.page';
import { VendingIndexServiceService } from '../vending-index-service.service';
import { SerialServiceService } from '../services/serialservice.service';
import { Toast } from '@capacitor/toast';
import { RemainingbilllocalPage } from '../remainingbilllocal/remainingbilllocal.page';
import { GenerateLaoQRCodeProcess } from './LaoQR_processes/generateLaoQRCode.process';
import dayjs from 'dayjs';
import { DatabaseService } from '../database.service';
import { IBankNote, IHashBankNote } from '../vmc.service';
import { Zdm8Service } from '../zdm8.service';
import { LiveupdateService } from '../liveupdate.service';
import { App } from '@capacitor/app';
import { VideoCacheService } from '../video-cache.service';
import { SettingPage } from '../setting/setting.page';
import { CloseStytemPage } from '../close-stytem/close-stytem.page';
import { IResModel } from '../services/syste.model';
import { QrOpenStockPage } from '../qr-open-stock/qr-open-stock.page';
import { Router } from '@angular/router';
import { AutoPaymentTopUpPage } from '../auto-payment-top-up/auto-payment-top-up.page';
import { interval, Subscription } from 'rxjs';
import { CustomNumberPadPage } from '../custom-number-pad/custom-number-pad.page';
import { AlertController } from '@ionic/angular';
import { BlockchainDbService } from '../blockchain-db';
import { NumpadModalComponent } from '../components/numpad-modal/numpad-modal.component';
import { QrconfigMachinePage } from '../qrconfig-machine/qrconfig-machine.page';
import { BillNotDropPage } from '../bill-not-drop/bill-not-drop.page';
import { GetCouponPromotionPage } from '../get-coupon-promotion/get-coupon-promotion.page';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnDestroy {
  private router = inject(Router);  // <-- Add this line instead of constructor parameter
  readyState = false;
  contact = localStorage.getItem('contact') || '55516321';
  menus = [];


  serial: ISerialService | null = null;
  open = false;

  vlog = { log: { data: '', limit: 50 } as IlogSerial };


  devices = ['VMC', 'ZDM8', 'Tp77p', 'essp', 'cctalk', 'm102', 'adh815', 'adh814'];

  selectedDevice = localStorage.getItem('device') || 'adh814';
  NV9USB = localStorage.getItem('NV9USB') || 'false';

  portName = localStorage.getItem('portName') || '/dev/ttyS1';
  baudRate = localStorage.getItem('baudRate') || 38400;
  platforms: { label: string; value: ESerialPortType }[] = [];
  isSerial: ESerialPortType = ESerialPortType.Serial;

  // adsList: any = localStorage.getItem('adsList') || [];

  connecting = false;

  // isDropStock = false;

  offlineMode: Boolean = true;

  isOpenStock = false;
  private numpadModal?: HTMLIonModalElement;


  // enableCashIn: boolean = false;

  isShowLaabTabEnabled: boolean = false;

  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;
  private cashValidationProcess: CashValidationProcess;
  private cashinValidationProcess: CashinValidationProcess;
  private loadStockListProcess: LoadStockListProcess;

  private CONTROL_MENUList: Array<{ name: string; status: boolean }> = [];
  private links: NodeListOf<HTMLLinkElement> | undefined;

  private ownerUuid: string | undefined;
  filemanagerURL: string = environment.filemanagerurl;

  acceptcash: number = 0;
  _machineStatus = { status: {} as IMachineStatus };

  machinestatus = { data: '' };

  production = environment.production;

  hmLogo = 'assets/icon/logo.png';
  redemgif = 'assets/redeemqr.gif';


  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();

  bills = {} as IVendingMachineBill;

  machineId = {} as IMachineId;

  url = environment.url;
  orders = new Array<IVendingMachineSale>();
  swidth = 0;
  sheight = 0;
  smode = 2;

  summarizeOrder = new Array<IVendingMachineSale>();
  getTotalSale = { q: 0, t: 0 };

  saleList = new Array<IVendingMachineSale>();
  timeoutHandler: any;
  manageStockCount = 0;
  compensation = 0;
  _checkHowTo_Duration = 1000 * 60 * 10;
  _checkHowTo_Time = 1000 * 60 * 10; // 10 minutes
  _howToT: any;
  _howToPage: HTMLIonModalElement | undefined;
  isFirstLoad = true;
  autopilot = { auto: 0 };


  isRobotMuted = localStorage.getItem('isRobotMuted') ? true : false;
  isMusicMuted = localStorage.getItem('isMusicMuted') ? true : false;
  // isAds = localStorage.getItem('isAds') ? true : false;

  qrMode = localStorage.getItem('qrMode') ? true : false;

  musicVolume = localStorage.getItem('musicVolume') ? Number(localStorage.getItem('musicVolume')) : 6;

  selectMode: string = 'vending';


  adsOn: Boolean = false;


  notes = new Array<IBankNote>();

  segementList: Array<any> = [
    {
      name: 'Vending',
      link: 'vending'
    },
    {
      name: 'Hangmi Store',
      link: 'hangmistore'
    },
    {
      name: 'Hangmi Food',
      link: 'hangmifood'
    },
    {
      name: 'Topup & Services',
      link: 'topupandservices'
    }
  ];
  webviewList: Array<any> = [
    {
      icon: "../../assets/webview/vending.png",
      name: 'ຕູ້ຂາຍສິນຄ້າອັດຕະໂນມັດ',
      description: 'ລະບົບຂາຍສິນຄ້າອັດຕະໂນມັດຜ່ານຕູ້',
      link: 'vending'
    },
    {
      icon: "../../assets/webview/smartcb.png",
      name: 'ຄວບຄຸມເຄື່ອງໃຊ້ໄຟຟ້າ',
      description: 'ລະບົບຄວບຄຸມເຄື່ອງໃຊ້ໄຟຟ້າອັດຕະໂນມັດ',
      link: 'smartcb'
    },
    // {
    //   icon: "../../assets/webview/topupandservices.jpeg",
    //   name: 'Topup & Services',
    //   description: 'Online payment and options',
    //   link: 'topupandservices'
    // }
  ]

  currentSegementTab: string = ITabVendingSegement.vending;

  autoShowMyOrderTimer: any = {} as any;
  autoShowMyOrdersCounter: number = 15;

  // isFranciseMode: boolean = localStorage.getItem('francisemode') ? true : false;
  // isFranciseMode: boolean = true;


  checkAppUpdate: boolean = false;
  autoDismissCheckAppUpdate: any = {} as any;
  loadingCheck: any = {} as any;
  loadingPercent: number = 0;

  otherModalAreOpening: boolean = false;

  lastUpdate: number = Date.now();
  lastAction: number = Date.now();

  t: any;
  count = 7;


  countdownCheckLaoQRPaidTimer: any = {} as any;
  // countdownCheckLaoQRPaid: number = 90;
  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;


  processedQRPaid = false;


  private creditPending: ICreditData[] = [];

  // interval
  refreshAll: any = {} as any;
  refreshAllCounter: number = 0;
  firstCredit: boolean = true;

  queues = new Array<{ data: any, command: string }>();



  TIMEOUT_MS = 15 * 60 * 1000; // 900,000 ms

  timeoutId: NodeJS.Timeout | null = null;

  // Variable to track the last time sendStatus was called
  lastCallTime: number | null = null



  sendStatus(b: string, t: number, c: EMACHINE_COMMAND = EMACHINE_COMMAND.MACHINE_STATUS) {
    this.lastCallTime = Date.now();

    // Clear any existing timeout
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    // Set a new timeout
    // this.timeoutId = setTimeout(() => {
    //   // Check if 15 minutes have passed since last call
    //   if (this.lastCallTime && Date.now() - this.lastCallTime >= this.TIMEOUT_MS) {
    //     console.log('No status sent for 15 minutes. Exiting app.');
    //     App.exitApp();
    //   }
    // }, this.TIMEOUT_MS);





    console.log('machine send', b, t, c);
    // Toast.show({ text: 'machine send' + b + ' ' + t + ' ' + c, duration: 'long' });
    // API TO SEND TO SERVER 
    // create API TO ACCEPT THIS 
    if (this.queues.find(v => v.command == c && v.data == b)) {
      console.log('Already in queue');
      return;
    }
    this.queues.push({ data: b, command: c });
    try {
      const timeOut = this.queues.length;
      const that = this;
      setTimeout(() => {
        that.apiService.updateStatus({ data: b, transactionID: t, command: c }).then(async rx => {
          const r = rx.data
          that.queues.shift();
          console.log('QUEUES', that.queues);
          console.log('vmc service send response', r);
          // Toast.show({ text: 'Machine send response' + JSON.stringify(r), duration: 'long' });
          if (r.command === EMACHINE_COMMAND.CREDIT_NOTE) {
            if (r.transactionID) {
              const x = that.creditPending.find(v => v.transactionID === r.transactionID);
              if (x) {
                await that.deleteCredit(x.id);
                that.creditPending = that.creditPending.filter(v => v.transactionID !== r.transactionID);
                // Toast.show({ text: 'Delete credit' + JSON.stringify(x), duration: 'long' });
              }
              // Toast.show({ text: 'Machine send response su' + JSON.stringify(r), duration: 'long' });
            } else {
              console.log('vmc service send response falied and retry', r);
              setTimeout(() => {
                that.sendStatus(b, t
                  , c);
              }, 5000);
              // Toast.show({ text: 'Machine send response falied and retry' + JSON.stringify(r), duration: 'long' });
            }
          } else {
            console.log('update machine Status', r);
          }
        })
      }, 1000 * timeOut);

    } catch (error) {
      console.log('vmc service send error', error);
    }

  }


  allowCashIn = false;
  light = { start: 3, end: 2 };

  allowVending = true;
  tempStatus: { lowTemp: number, highTemp: number } = { lowTemp: 5, highTemp: 10 };

  initHashBankNotes(machineId: string) {
    const hashNotes = Array<IHashBankNote>();
    for (let i = 0; i < this.notes.length; i++) {
      const x = JSON.parse(JSON.stringify(this.notes[i])) as IHashBankNote;
      x.hash = cryptojs
        .SHA256(machineId + this.notes[i].value * 100)
        .toString(cryptojs.enc.Hex);
      hashNotes.push(x);
    }
    return hashNotes;
  }



  async deleteCredit(id: number) {
    await this.dbService.deleteItem(id);
    return await this.loadCredits();
  }

  async loadCredits() {
    return await this.dbService.getItems();
  }

  async addOrUpdateCredit(data: ICreditData) {
    if (data.id >= 0) {
      await this.dbService.updateItem(data.id, data.name, data.data, data.transactionID, data.description);
    } else {
      await this.dbService.createItem(data.name, data.data, data.transactionID, data.description);
    }
    return await this.loadCredits();
  }
  sendStatusTest() {
    this.sendStatus('fafb522123000000000f000000000000000000303030303030303030300faaaaaaaaaaaaaafb', 1, EMACHINE_COMMAND.VMC_MACHINE_STATUS);
  }

  async showModal(component: any, d: any = {}, cssClass: string = '') {
    try {
      return await this.modal.create({
        component,
        componentProps: d,
        cssClass: cssClass || 'full-modal',
        // backdropDismiss:false
      });
    } catch (error) {
      console.log('ERROR', error);
      alert('Error')
    }
  }

  selectModeFunc(data: any) {
    console.log('select', data);
    this.selectMode = data + '';
  }

  onClickSmartCB(item: any) {
    if (item.title == 'Scan QR Code') {

    } else if (item.title == 'Register owner') {

    } else {
      this.apiService.showModal(item.path).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }
    //   let data = {
    //     ownerId:1
    //   }
    //   this.m.showModal(ShowDevicesPage,{data}).then((r) => {
    //     if (r) {
    //       r.present();
    //       r.onDidDismiss().then((res) => {
    //         if (res.data.dismiss) {
    //         }
    //       });
    //     }
    //   });
  }


  constructor(
    private ref: ChangeDetectorRef,
    public apiService: ApiService,
    private liveUpdateService: LiveupdateService,
    public platform: Platform,
    public modal: ModalController,
    // private scanner: @ionic-native/serial,
    public storage: IonicStorageService,
    public appCaching: CachingService,
    private vendingAPIService: VendingAPIService,
    private WSAPIService: WsapiService,
    private cashingService: AppcachingserviceService,
    public loading: LoadingController,
    private vendingIndex: VendingIndexServiceService,
    private dbService: DatabaseService,
    private alertController: AlertController,
    // private videoCacheService: VideoCacheService,
    // public router: Router
    public blockchainDbService: BlockchainDbService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {

    // this.refreshAllEveryHour();

    this.autopilot = this.apiService.autopilot;
    const that = this;
    this.dynamicControlMenu();


    // this.autoUpdateCash();

    this.loadVendingWalletCoinBalanceProcess =
      new LoadVendingWalletCoinBalanceProcess(
        this.apiService,
        this.vendingAPIService
      );
    this.cashValidationProcess = new CashValidationProcess(
      this.apiService,
      this.vendingAPIService
    );
    this.cashinValidationProcess = new CashinValidationProcess(
      this.apiService,
      this.vendingAPIService
    );
    this.loadStockListProcess = new LoadStockListProcess(
      this.apiService,
      this.cashingService
    );


    this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);


    // alert('V1_'+this.mmLogo);

    // ref.detach();
    // this.zone.runOutsideAngular(()=>{
    this.machineId = this.apiService.machineId;
    this.url = this.apiService.url;


    // this.initVendingSale();



    platform.ready().then(() => {
      // this.loadBrightness();
      // this.autoCheckAppVersion();

      // this.toggleTabServicesSegment();

      this.ownerUuid = localStorage.getItem('machineId') || '';
      this.apiService.audioElement = document.createElement('audio');
      this.apiService.backGroundMusicElement = document.createElement('audio');
      console.log('Width: ' + (this.swidth = platform.width()));
      console.log('Height: ' + (this.sheight = platform.height()));
      console.log('screen width', this.swidth, 'screen height', this.sheight);
      if (this.swidth > 550) this.smode = 3;
      else this.smode = 2;
      // setTimeout(() => {
      console.log('loading sale list');

      // }, 1000);
      this.vendingOnSale = ApiService.vendingOnSale;
      this.vendingBillPaid = this.apiService.vendingBillPaid;
      this.vendingBill = this.apiService.vendingBill;
      this.onlineMachines = this.apiService.onlineMachines;

      try {
        this.apiService.wsapi.loginSubscription.subscribe((rxx) => {
          if (!rxx) return console.log('empty');
          console.log('ws login subscription', rxx);
          this.apiService.myTab1 = this;
          this.apiService.clientId.clientId = rxx.clientId;
          this.apiService.wsAlive.time = new Date();
          this.apiService.wsAlive.isAlive = this.apiService.checkOnlineStatus();
          // this.loadSaleList();
          // this.initStock();
          if (this.isFirstLoad) {


            this.loadStock();
            this.isFirstLoad = false;
          }
        });
      } catch (error) {

      }




      this.apiService.onDeductOrderUpdate((position) => {
        try {
          // const x = JSON.parse(JSON.stringify(that.vendingOnSale));
          // console.log('before SAVE ==>',x);
          // setTimeout(() => {
          // this.storage.get('saleStock', 'stock').then((s) => {
          //   try {
          //     console.log(`storage get`, s);

          //     const saleitems = JSON.parse(
          //       JSON.stringify(s?.v ? s.v : [])
          //     ) as Array<IVendingMachineSale>;
          //     that.apiService.saveSale(saleitems).subscribe((r) => {
          //       console.log(r);
          //       if (r.status) {
          //         console.log(`save sale success`);
          //       } else {
          //         this.apiService.simpleMessage(IENMessage.saveSaleFail);
          //       }
          //     });
          //   } catch (error) {
          //     console.log('error', error);
          //   }
          // });

          // }, 1000);

          // for stack order UI
          const ind = this.orders.findIndex((v) => v.position == position);
          if (ind != -1) this.orders.splice(ind, 1);
        } catch (error) {
          console.log(' error on event emitter');
        }
      });

      // const vsale = this.saleList;
      // this.apiService.wsapi.onBillProcess((r) => {
      //   if (!r) return console.log('empty');
      //   console.log('ws process subscription', r);
      //   const message =
      //     'processing slot ' +
      //     r.position +
      //     `==>${r.position}` +
      //     '; ' +
      //     r?.bill?.vendingsales?.find((v) => v.position == r.position)?.stock
      //       ?.name;

      //   // const x = this.vendingOnSale?.find(v => r?.bill?.vendingsales.find(vx => vx.stock.id == v.stock.id && r.position.position + '' == vx.position + ''));

      //   const x = vsale.find((v) => {
      //     if (v.position == r.position) {
      //       v.stock.qtty--;
      //       return true;
      //     }
      //   });
      //   console.log('X', x, r.position, x && r.position);

      //   if (x && r.position) {
      //     // # save to machine
      //     console.log('saveSale', vsale);

      //     // this.clearWaitingT();

      //     // PLAY SOUNDS
      //     this.apiService.soundCompleted();
      //     setTimeout(() => {
      //       this.apiService.soundThankYou();
      //     }, 2000);
      //     that.apiService.toast
      //       .create({ message, duration: 2000 })
      //       .then((r) => {
      //         r.present();
      //       });

      //     r.bill.updatedAt = new Date();
      //   } else if (!r.position) {
      //     // PLAY SOUNDS
      //     this.apiService.soundSystemError();
      //     this.apiService.alert
      //       .create({
      //         header: 'Alert',
      //         message,
      //         buttons: [
      //           {
      //             text: 'OK',
      //             role: 'confirm',
      //             handler: () => {},
      //           },
      //         ],
      //       })
      //       .then((v) => v.present());
      //   }

      //   console.log(`vendingOnSale-->`, vsale);
      //   this.storage.set('saleStock', vsale, 'stock').then((r) => {
      //     // that.deductOrderUpdate(x.position);
      //   });

      //   // });
      // });
    });
    // });

    setTimeout(() => {
      // this.checkHowTo();
    }, 5000);
  }


  calculateTicketValue(items: [{ value: number }], maxVal: number = 100000) {
    let ticketValue = 0;

    for (const item of items) {
      let contribution = 1000; // Base contribution
      if (item.value > maxVal) {
        // Calculate additional contribution based on ranges
        const extraRanges = Math.ceil((item.value - maxVal) / maxVal);
        contribution += extraRanges * 1000;
      }
      ticketValue += contribution + item.value;
    }
    return ticketValue;
  }

  openTestKeyboad() {

  }

  async ngOnInit() {




    /// TESTING MODE OR REAL MODE
    if (localStorage.getItem('startTestMotor')) {
      this.startTestMotor();
      return;
    }
    // try {
    //   await ScreenBrightness.setBrightness({ brightness: 1 });
    // } catch (error) {
    //   console.error('Failed to set brightness', error);
    // }
    /// END TESTING MODE OR REAL MODE


    // this.startTestMotor();
    // return;















    // window.addEventListener('beforeunload', async (event) => {
    //   Toast.show({ text: 'Before reload', duration: 'long' });
    //   await this.serial.close();

    // });
    // check nee restart
    console.log('-----> 1');

    const r = localStorage.getItem('restart');
    if (r) {
      localStorage.removeItem('restart');
      setTimeout(() => {
        this.apiService.exitApp();

      }, 10000);

      return;
    }



    console.log('-----> 2');


    this.isShowLaabTabEnabled = JSON.parse(localStorage.getItem(this.apiService.controlMenuService.localname) || '{}').find((x: any) => x.name == 'menu-showlaabtab').status ?? false;

    console.log('-----> 3');

    this.platforms = Object.keys(ESerialPortType)
      .filter(key => isNaN(Number(key))) // Remove numeric keys
      .map(key => ({
        label: key,  // Display name
        value: ESerialPortType[key as keyof typeof ESerialPortType] // Enum value
      }));
    try {
      console.log('-----> 4');

      try {
        if (!localStorage.getItem('baudRate') && !localStorage.getItem('portName')) {
          // Show UI prompt only on first time (no saved values)
          const alert = await this.alertController.create({
            header: 'Serial Connection Setup',
            subHeader: 'First time setup - please confirm or change defaults',
            message: `Default settings:\n\nPort: /dev/ttyS1\nBaud Rate: 38400\n\nUse these values?`,
            buttons: [
              {
                text: 'Change',
                role: 'cancel',
                handler: async () => {
                  // User wants to change → show input prompt
                  const changeAlert = await this.alertController.create({
                    header: 'Custom Serial Settings',
                    inputs: [
                      {
                        name: 'portName',
                        type: 'text',
                        label: 'Port Name',
                        value: '/dev/ttyS1',
                        placeholder: 'e.g. /dev/ttyUSB0 or /dev/ttyS0'
                      },
                      {
                        name: 'baudRate',
                        type: 'number',
                        label: 'Baud Rate',
                        value: 38400,
                        min: 9600,
                        max: 115200
                      }
                    ],
                    buttons: [
                      {
                        text: 'Cancel',
                        role: 'cancel'
                      },
                      {
                        text: 'Save & Connect',
                        handler: (data: any) => {
                          const port = data.portName?.trim() || '/dev/ttyS1';
                          const baud = parseInt(data.baudRate, 10) || 38400;

                          localStorage.setItem('portName', port);
                          localStorage.setItem('baudRate', baud.toString());

                          console.log(`Saved custom: ${port} @ ${baud} baud`);
                        }
                      }
                    ]
                  });

                  await changeAlert.present();
                }
              },
              {
                text: 'Use Defaults',
                handler: () => {
                  localStorage.setItem('portName', '/dev/ttyS1');
                  localStorage.setItem('baudRate', '38400');
                  console.log('Using defaults: /dev/ttyS1 @ 38400');
                }
              }
            ]
          });

          await alert.present();

          // Optional: wait for alert to be dismissed before continuing
          await alert.onDidDismiss();
          await new Promise(resolve => setTimeout(resolve, 15000)); // Small delay to ensure localStorage is updated  
        }
        await this.connect();
      } catch (errorSerial) {
        console.log('errorSerial', errorSerial);
      }
      console.log('-----> 5');

      Toast.show({ text: 'READY', duration: 'long' })

      this.apiService.toast.create({ message: 'readyState', duration: 2000 }).then(r => r.present());
      this.readyState = true;

    } catch (error) {
      Toast.show({ text: 'Error connecting to serial port ' + JSON.stringify(error || {}), duration: 'long' });
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error connecting to serial port :${JSON.stringify(error)}` });
    }

    // this._processLoopCheckLaoQRPaid();


    console.log('readyState ALIVE', this.readyState);

    this.WSAPIService.aliveSubscription.subscribe(async res => {
      try {
        this.lastUpdate = Date.now();
        console.log('----->ALIVE TAB1', JSON.stringify(res || {}));
        const r = res?.data?.setting;
        if (res?.data?.settingVersion) {
          // localStorage.setItem('settingVersion', res?.data?.settingVersion);
        }
        if (res?.data?.sendWSMode) {
          localStorage.setItem('sendWSMode', res?.data?.sendWSMode ? 'yes' : 'no');
        }
        if (r) {
          try {
            if (r?.refresh) {
              Toast.show({ text: 'Refresh ' + r.refresh, duration: 'long' });
              return this.refresh();
            }
            if (r?.exit) {
              setTimeout(() => {
                Toast.show({ text: 'Refresh ' + r.refresh, duration: 'long' });
                this.apiService.exitApp();

              }, 5000);
              return;
            }

            if (r?.reboot) {
              setTimeout(() => {
                Toast.show({ text: 'Refresh ' + r.refresh, duration: 'long' });
                this.apiService.rebootMachine();
              }, 5000);
              return;
            }

            if (r?.takeSnapshot) {
              this.apiService.takeScreenshotAndUpload(`${environment.url}/saveScreenshot`);
              return;
            }
            if (r?.recoverSale) {
              console.log('-----> RECONVER SALE');

              Toast.show({ text: 'recoverSale ' + r.recoverSale, duration: 'long' });
              this.storage.set('saleStock', [], 'stock');

              setTimeout(() => {
                return this.refresh();
              }, 1000);
              return;
            }
            if (r?.brightness) {
              this.setBrightness(r?.brightness);
            }
            if (r?.startTestMotor) {
              localStorage.setItem('startTestMotor', 'true');
              this.refresh();
            }

            if (this.apiService.checkProcessTime()) {
              this.apiService.takeScreenshotAndUpload(`${environment.url}/saveScreenshot`);
            }
          } catch (err) {
            this.apiService.IndexedLogDB.addBillProcess({ errorData: `Err refresh or exit app is :${JSON.stringify(err)}` })
          }
        }
        if (r && this.readyState) {
          // if (r) {
          // set allow vending
          console.log('ALLOW VENDING', r.allowVending);

          // อ่านค่าจาก localStorage
          // const localStorageValue = localStorage.getItem('allowVending') ?? '';
          // let allowVending = localStorageValue === 'yes';

          // อัปเดต localStorage ด้วยค่าล่าสุด
          // localStorage.setItem('allowVending', r.allowVending ? 'yes' : '');

          // ตรวจสอบว่ามีการเปลี่ยนค่า allowVending
          if (this.allowVending !== r.allowVending) {
            this.allowVending = r.allowVending;

            const currentRoute = await this.apiService.modalCtrl.getTop();

            if (this.allowVending) {
              await this.apiService.toast.create({
                message: 'Close Tab CloseSystem',
                duration: 3000,
              }).then(t => t.present());

              if (currentRoute?.component === CloseStytemPage) {
                currentRoute.dismiss();
              }
            } else {
              if (!currentRoute) {
                this.apiService.showModal(CloseStytemPage, {}, false, 'full-modal')
                  .then(modal => modal?.present());
              }

              await this.apiService.toast.create({
                message: 'Open Tab CloseSystem',
                duration: 3000,
              }).then(t => t.present());
            }
          }


          // localStorage.setItem('qrPayment', r.qrPayment ? 'yes' : '');

          // if (this.isAds != r.isAds) {
          //   this.isAds = r.isAds;
          //   // console.log('Update isAds to', this.isAds);
          //   localStorage.setItem('isAds', this.isAds ? 'yes' : '');

          //   const adsSlide = localStorage.getItem('isAds');
          //   if (adsSlide != undefined && adsSlide == 'yes') {
          //     if (!this.adsOn) {
          //       const currentRoute = await this.apiService.modal.getTop();
          //       if (!currentRoute) {
          //         this.apiService.showModal(AdsPage).then(r => {
          //           r.present();
          //           this.otherModalAreOpening = true;
          //           this.checkActiveModal(r);
          //           this.openAnotherModal(r);

          //           this.adsOn = true;
          //           r.onDidDismiss().then(rx => {
          //             this.adsOn = false;
          //           })
          //         })
          //       }
          //     } else {
          //       this.adsOn = false;
          //       this.apiService.dismissModal();
          //       const currentRoute = await this.apiService.modal.getTop();
          //       if (!currentRoute) {
          //         this.apiService.showModal(AdsPage).then(r => {
          //           r.present();
          //           this.otherModalAreOpening = true;
          //           this.checkActiveModal(r);
          //           this.openAnotherModal(r);

          //           this.adsOn = true;
          //           r.onDidDismiss().then(rx => {
          //             this.adsOn = false;
          //           })
          //         })
          //       }
          //     }
          //   } else {
          //     if (this.adsOn) {
          //       this.adsOn = false;
          //       this.apiService.dismissModal();
          //     }
          //   }


          //   this.apiService.soundGreeting();
          // }

          if (this.isMusicMuted != r.isMusicMuted) {
            this.isMusicMuted = r.isMusicMuted;
            console.log('Update isMusicMuted to', this.isMusicMuted);

            localStorage.setItem('isMusicMuted', this.isMusicMuted ? 'yes' : '');
            this.apiService.backgrounSound = this.isMusicMuted;
            // console.log('this.apiService.backgrounSound', this.apiService.backgrounSound);
            if (this.isMusicMuted) {
              this.apiService.backGroundMusicElement.pause();
            } else {
              this.apiService.playBackGroundMusic();
            }
          }
          if (this.offlineMode != r.offlineMode) {
            this.offlineMode = r.offlineMode;
            localStorage.setItem('offlineMode', this.offlineMode ? 'true' : 'false');
            console.log('Update offlineMode to', this.offlineMode);
          }

          if (this.isRobotMuted != r.isRobotMuted) {
            this.isRobotMuted = r.isRobotMuted;
            console.log('Update isRobotMuted to', this.isRobotMuted);

            localStorage.setItem('isRobotMuted', this.isRobotMuted ? 'yes' : '');
            this.apiService.muteSound = this.isRobotMuted;
            // console.log('this.apiService.muteSound', this.apiService.muteSound);

            if (!this.isRobotMuted) {
              this.apiService.audioElement.pause();
            } else {
              // this.apiService.playSound();
            }
            // console.log('this.apiService.backgrounSound', this.apiService.backgrounSound);
          }

          if (this.musicVolume != r.musicVolume) {
            this.musicVolume = r.musicVolume;
            console.log('Update musicVolume to', this.musicVolume);
            localStorage.setItem('musicVolume', this.musicVolume.toString());
            this.apiService.musicVolume = this.musicVolume;
            // this.refresh();

          }
          if (r?.brightness) {
            this.setBrightness(r?.brightness || 1);
          }
          if (this.platform.is('android')) {
            if (r.versionId && r?.versionId !== '0.0.0') {
              const updateVersion = localStorage.getItem('updateVersion') ?? environment.versionId;
              console.log('check current version', updateVersion, ' check r.versionId', r?.versionId, 'env versionId', environment.versionId);
              if (updateVersion != r.versionId) {
                localStorage.setItem('updateVersion', r?.versionId ?? environment.versionId);
                console.log('Update versionId to', r?.versionId, 'current version', updateVersion, 'env versionId', environment.versionId);
                this.apiService.toast.create({ message: `Update versionId to ${r?.versionId} from version ${updateVersion} env versionId ${environment.versionId}`, duration: 3000 }).then(r => r.present());
                this.apiService.IndexedLogDB.addBillProcess({ errorData: `Update versionId to ${r?.versionId}` });

                // setTimeout(() => {
                //   if (this.serial) {
                //     await this.serial?.close();
                //     console.log('serial closed');
                //     Toast.show({ text: 'Serial closed', duration: 'long' });
                //     this.serial = null;
                //   }
                //   this.checkLiveUpdate(r?.versionId);
                // }, 15000);

              }

            }

          }

          // if (r.versionId && this.versionId !== r.versionId) {
          //   this.versionId = r.versionId;
          //   console.log('Update versionId to', r.versionId);
          //   this.apiService.IndexedLogDB.addBillProcess({ errorData: `Update versionId to ${r.versionId}` });
          //   this.checkLiveUpdate(r.versionId);
          // }

          // if (this.areArraysDifferentUnordered(this.adsList ?? [], r.adsList ?? [])) {
          //   try {
          //     const result = this.getReplacements(this.adsList ?? [], r.adsList ?? []);
          //     this.adsList = r.adsList;
          //     localStorage.setItem('adsList', JSON.stringify(this.adsList));
          //     console.log('Update adsList to', this.adsList);

          //     console.log('result', result);
          //     if (result.remove.length > 0) {
          //       // this.apiService.removeAds(result.remove);
          //       for (let index = 0; index < result.remove.length; index++) {
          //         const element = result.remove[index];
          //         await this.videoCacheService.deleteCachedVideo(element);
          //         console.log('remove ads', element);

          //       }
          //     }
          //     if (result.add.length > 0) {
          //       // this.apiService.addAds(result.add);
          //       for (let index = 0; index < result.add.length; index++) {
          //         const element = result.add[index];
          //         await this.videoCacheService.getCachedVideoBase64(element);
          //         console.log('add ads', element);
          //       }
          //     }

          //   } catch (error) {
          //     console.log('Error getReplacements', error);
          //   }

          // }

          if (this.selectedDevice == 'VMC') {
            // set allow cashIn
            if (this.allowCashIn != r.allowCashIn) {
              this.allowCashIn = r.allowCashIn;
              if (this.allowCashIn) {

                await this.vendingIndex.vmc.enableCashIn();
                Toast.show({ text: 'CashIn enabled', duration: 'long' });
              } else {
                await this.vendingIndex.vmc.disableCashIn();
                Toast.show({ text: 'CashIn disabled', duration: 'long' });
              }
            }
            // set Temperature
            if (this.tempStatus.lowTemp !== r.lowTemp || this.tempStatus.highTemp !== r.highTemp) {
              this.tempStatus.lowTemp = r.lowTemp;
              this.tempStatus.highTemp = r.highTemp;
              // this.vendingIndex.vmc.command(EMACHINE_COMMAND.SET_TEMP, { lowTemp: this.tempStatus.lowTemp, highTemp: this.tempStatus.highTemp }, -1);
              this.vendingIndex.vmc.setTemperature(this.tempStatus.lowTemp, this.tempStatus.highTemp);
            }

            // set light
            if (this.light.start !== r.start || this.light.end !== r.end) {
              this.light = r.light;
              this.vendingIndex.vmc.setLights(this.light.start, this.light.end);
            }
          } else {
            console.log('Nothing to do for other devices');
          }



          if (this.selectedDevice == 'adh814') {
            // set Temperature
            if (this.tempStatus.lowTemp !== r.lowTemp || this.tempStatus.highTemp !== r.highTemp) {
              this.tempStatus.lowTemp = r.lowTemp;
              this.tempStatus.highTemp = r.highTemp;
              // this.vendingIndex.vmc.command(EMACHINE_COMMAND.SET_TEMP, { lowTemp: this.tempStatus.lowTemp, highTemp: this.tempStatus.highTemp }, -1);
              Toast.show({ text: `Update Tem to ${this.tempStatus.lowTemp}` });
              await this.vendingIndex.adh814.setTemperature(0x01, this.tempStatus.lowTemp);
            }


          } else {
            console.log('Nothing to do for other devices');
          }

          if (this.NV9USB) {
            if (this.allowCashIn != r.allowCashIn) {
              this.allowCashIn = r.allowCashIn;
              if (this.allowCashIn) {

                this.enableCash();
                Toast.show({ text: 'CashIn enabled', duration: 'long' });
              } else {
                this.disableCash();
                Toast.show({ text: 'CashIn disabled', duration: 'long' });
              }
            }
          }





        } else {
          console.log('No data from alive');
        }

      } catch (error) {
        Toast.show({ text: 'Error alive ' + JSON.stringify(error || '{}'), duration: 'long' })
      }



    });

    try {
      this.blockchainDbService.initialize(this.machineId.machineId).then(() => {
        console.log('Blockchain DB initialized successfully');
        console.log('SQLite initialized for machine:', this.machineId.machineId);
        this.loadBalance();
      }).catch(e => {
        console.error('SQLite init failed at app start:', e);
      })

    } catch (err) {
      console.error('SQLite init failed at app start:', err);
      // Optional: show toast or fallback to in-memory mode
    }


    /// CASHIN VM CASHIN
    // if (this.dbService.getReady()) {
    //   this.loadCredits().then(r => {
    //     this.creditPending.push(...r);
    //     this.creditPending.forEach((v, index) => {
    //       if (v.transactionID) {
    //         setTimeout(() => {
    //           this.sendStatus(v.data.data, Number(v.data.transactionID), v.data.command);
    //         }, 1000 * index);
    //       }
    //     });
    //     console.log('CREDIT PENDING', this.creditPending);
    //   });
    // } else {
    //   this.dbService.initializeDatabase().then(r => {
    //     console.log('Database initialized', r);
    //     // id: item.id,
    //     // name: item.name,
    //     // data: JSON.parse(item.data), // Parse JSON back to object
    //     // transactionID: item.transactionID,
    //     // description: item.description,
    //     this.loadCredits().then(r => {
    //       this.creditPending.push(...r);
    //       this.creditPending.forEach((v, index) => {
    //         if (v.transactionID) {
    //           setTimeout(() => {
    //             this.sendStatus(v.data.data, Number(v.data.transactionID), v.data.command);
    //           }, 1000 * index);
    //         }
    //       });
    //       console.log('CREDIT PENDING', this.creditPending);
    //     });
    //   }).catch(e => {
    //     console.log('Error init database', e);
    //   })
    // }

    // END CASHIN VMC
    this.checkLastClick();



  }


  checkLastClick() {
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
      setTimeout(() => {
        this.loadPaidBills();
        localStorage.setItem('lastClickCheck', '');
      }, 30000);

    } catch (error) {
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
      const stored = localStorage.getItem('lastClickCheck');
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
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // ลบข้อมูลที่ไม่ถูกต้อง
  private clearInvalidLastClick() {
    try {
      localStorage.removeItem('lastClickCheck');
      console.log('ลบข้อมูล lastClick ที่ไม่ถูกต้องออกแล้ว');
    } catch (error) {
      console.error('Error clearing invalid lastClick:', error);
    }
  }

  // ฟังก์ชันบันทึกเวลา
  setLastClick() {
    try {
      const now = new Date().toISOString();
      localStorage.setItem('lastClickCheck', JSON.stringify(now));
      console.log('บันทึกเวลาคลิกแล้ว:', now);
    } catch (error) {
      console.error('Error setting last click:', error);
    }
  }



  areArraysDifferentUnordered(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return true;

    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();

    return !sorted1.every((val, idx) => val === sorted2[idx]);
  }

  getReplacements(a1: string[], a2: string[]) {
    a1 = Array.isArray(a1) ? a1 : [];
    a2 = Array.isArray(a2) ? a2 : [];

    const removed = a1.filter(value => !a2.includes(value));
    const added = a2.filter(value => !a1.includes(value));

    return { remove: removed, add: added };
  }


  ngOnDestroy(): void {
    clearInterval(this.autoShowMyOrderTimer);
    clearInterval(this.autoDismissCheckAppUpdate);
    clearInterval(this.loadingCheck);
    clearInterval(this.loopPercent);
    clearInterval(this.installingPecent);
    clearInterval(this.refreshAll);
    clearInterval(this.countdownCheckLaoQRPaidTimer);

    // if (this.subscription) {
    //   this.subscription.unsubscribe();
    //   console.log('ngOnDestroy isFlipped :', this.isFlipped);

    // }
    if (this.serial) {
      this.serial?.close().then(() => {
        this.apiService.exitApp();
      }).catch(e => {
        this.apiService.toast.create({
          message: 'Error closing serial port: ' + JSON.stringify(e),
          duration: 3000
        }).then(t => t.present());
      });
      console.log('serial closed');
    }


  }




  async checkLiveUpdate(version: string) {
    try {
      this.liveUpdateService.checkForUpdates(version).then(async (res) => {

        console.log('checkForUpdates', res);

      }).catch((e) => {
        // this.refresh();

        console.log('Error checkLiveUpdate', e);
        this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error checkLiveUpdate :${JSON.stringify(e)}` });
      });
    } catch (error) {
      console.log('Error checkLiveUpdate', error);
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error checkLiveUpdate :${JSON.stringify(error)}` });
    }
  }

  // checkCurrentRoute() {
  //   setInterval(async () => {
  //     const currentRoute = await this.apiService.modal.getTop();
  //     console.log('=====>Current Route:', currentRoute);

  //   }, 5000);
  // }


  public _processLoopCheckLaoQRPaid(transactionID?: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        console.log('CHECK LAOQR SERVER');

        const run = await this.generateLaoQRCodeProcess.CheckLaoQRPaid();
        Toast.show({ text: `CHECK LAOQR SERVER ${JSON.stringify(run)}`, duration: 'long' });
        console.log('CHECK LAOQR SERVER', run);
        if (run.status == 1) {
          console.log('=====> LAOQR CHECK :', run.message['data']['bill']);

          await this.apiService.waitingDelivery(run.message['data']['bill'], this.serial);
          resolve(IENMessage.success);

        } else {
          resolve(IENMessage.success);
        }
      } catch (error) {
        this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error _processLoopCheckLaoQRPaid :${JSON.stringify(error)}` });

        console.log('Error _processLoopCheckLaoQRPaid', error);
        resolve(error);
      }

    });
  }


  async connect() {
    if (!this.selectedDevice) return Toast.show({ text: 'Please select setting', duration: 'long' });
    // Toast.show({ text: 'Prepare a connection to ' + this.selectedDevice });
    if (this.connecting) {
      return Toast.show({ text: 'Connecting' });
    }
    this.connecting = true;
    if (this.selectedDevice == 'VMC') {
      // this.baudRate = 57600;
      await this.startVMC();
      Toast.show({ text: 'Start VMC' });
    }
    else if (this.selectedDevice == 'ZDM8') {
      await this.startZDM8();
      Toast.show({ text: 'Start ZDM8' });
    }
    // else if (this.selectedDevice == 'Tp77p') {
    //   await this.satrtTp77p();
    //   Toast.show({ text: 'Start Tp77p3b' });
    // }
    // else if (this.selectedDevice == 'essp') {
    //   await this.startEssp();
    //   Toast.show({ text: 'Start essp' });
    // }
    // else if (this.selectedDevice == 'cctalk') {
    //   await this.startCctalk();
    //   Toast.show({ text: 'Start essp' });
    // }
    // else if (this.selectedDevice == 'adh815') {
    //   await this.startAHD815();
    //   Toast.show({ text: 'Start adh815' });
    // } 
    else if (this.selectedDevice == 'adh814') {
      await this.startAHD814();
      // Toast.show({ text: 'Start adh814' });
    }
    //  else if (this.selectedDevice == 'm102') {
    //   await this.startM102();
    //   Toast.show({ text: 'Start m102' });
    // }
    else {
      Toast.show({ text: 'Please select device' })
    }
    this.connecting = false;
    if (this.serial)
      this.apiService.serialPort = this.serial;
  }
  // VMC only
  async Enable() {
    console.log('Enable');

    if (this.serial) {
      await this.vendingIndex.vmc.enableCashIn();
      this.apiService.toast.create({
        message: 'Enable cash in',
        duration: 2000
      }).then(r => r.present());
    } else {
      Toast.show({ text: 'serial not init' });

    }
  }
  // VMC only
  async Disable() {
    console.log('Disable');

    if (this.serial) {
      await this.vendingIndex.vmc.disableCashIn();
      this.apiService.toast.create({
        message: 'Disable cash in',
        duration: 2000
      }).then(r => r.present());
    } else {
      Toast.show({ text: 'serial not init' });

    }
  }
  async startVMC() {
    if (this.serial) {
      await this.serial?.close();
      this.serial = null;
    }

    this.serial = await this.vendingIndex.initVMC(this.portName, Number(this.baudRate), '', '', this.isSerial);

    if (!this.serial) {
      Toast.show({ text: 'serial not init for start VMC' });
    } else {
      this.serial.getSerialEvents().subscribe((event: any) => {
        try {
          console.log('vmc service event received: ' + JSON.stringify(event));
          if (event.event === 'dataReceived') {
            // this.addLogMessage(`Received: ${event.data}`);
            // this.processVMCResponse(event.data);
            this.processVMCResponse(event.data);
            this.apiService.setLastSerialAction();
          } else if (event.event === 'commandAcknowledged') {
            console.log('Command acknowledged by VMC:', event.data);
            this.apiService.setLastSerialAction();
          } else if (event.event === 'error') {
            console.error('Serial error:', event);
            // this.addLogMessage(`Serial error: ${JSON.stringify(event)}`);
          } else {
            console.error('Serial event:', event);

          }
          if (event?.event === 'nv9Event') {
            this.handleNV9Event(event?.data);
          }
        } catch (error: any) {
          console.error('Error processing event:', error);
          // this.addLogMessage(`Error processing event: ${error.message}`);
        }
      });


      // Toast.show({ text: 'VMC Cashin', duration: 'long' });
      // console.log('VMC Cashin');
      // this.offlineMode = Boolean(localStorage.getItem('offlineMode') ?? 'true');

      // // // FIX FIRMWARE bugs when reconnect to VMC
      // setTimeout(async () => {
      //   this.isFirstLoad = false;
      //   if (!this.offlineMode) {
      //     await this.vendingIndex.vmc.enableCashIn();
      //     Toast.show({ text: 'CashIn enabled', duration: 'long' });
      //   }
      //   else {
      //     await this.vendingIndex.vmc.disableCashIn();
      //     Toast.show({ text: 'CashIn disabled', duration: 'long' });
      //   }
      // }, 20000);
    }
    this.vlog.log = this.serial.log;
  }


  testDrop(slot: number) {
    // console.log('=====> testDrop', slot);

    if (this.serial) {
      const param = { slot: slot, dropSensor: 1 };
      this.vendingIndex.vmc.shipItem(param.slot, param.dropSensor).then(async (r) => {
        console.log('shippingcontrol', r);
        // this.val = r?.data?.x;
        await Toast.show({ text: 'shippingcontrol' + JSON.stringify(r) })
      });

    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }

  async startZDM8() {
    try {
      if (this.serial) {
        await this.serial?.close();
        this.serial = null;
      }
      console.log('starting ZDM8');
      this.serial = await this.vendingIndex.initZDM8(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
      if (!this.serial) {
        Toast.show({ text: 'serial not init ' + this.selectedDevice });
      } else {
        this.serial.getSerialEvents().subscribe((event: any) => {
          try {
            console.log('zdm8 service event received: ' + JSON.stringify(event));
            // if (event.event === 'dataReceived') {
            // const rawData = event.data; // Assuming event.data contains the raw hex string

            // console.log('zdm service Received from device:', rawData);
            // const d = typeof rawData === 'object' ? JSON.stringify(rawData) : rawData;
            // Toast.show({ text: 'zdm service Received from device: ' + d, duration: 'long' });
            // Process the Modbus response
            // const response = this.vendingIndex.zdm8.processModbusResponse(rawData);
            // if (response) {
            //   console.log('Processed Modbus response:', response);
            // }
            // Toast.show({ text: 'Processed Modbus response: ' + JSON.stringify(response), duration: 'long' });
            // }

            console.error('Serial event:', event);
            if (event?.event === 'nv9Event') {
              this.handleNV9Event(event?.data);
            }

          } catch (error: any) {
            console.error('Error processing event:', error);
            Toast.show({ text: 'Error processing event: ' + error.message });
            // this.addLogMessage(`Error processing event: ${error.message}`);
          }
        });
        Toast.show({ text: 'serial initialized succeeded ' + this.selectedDevice });
      }
      this.vlog.log = this.serial.log;
    } catch (error: any) {
      Toast.show({ text: 'Error initializing serial: ' + error.message });
    }

  }

  // async satrtTp77p() {
  //   if (this.serial) {
  //     await this.serial?.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initPulseTop77p(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }
  // async startEssp() {
  //   if (this.serial) {
  //     await this.serial?.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initEssp(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }
  // async startCctalk() {
  //   if (this.serial) {
  //     await this.serial?.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initCctalk(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }
  // async startAHD815() {
  //   if (this.serial) {
  //     await this.serial?.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initADH815(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }

  async startAHD814() {
    if (this.serial) {
      await this.serial?.close();
      this.serial = undefined as unknown as ISerialService;
    }
    // Toast.show({ text: `Starting ADH814 ${this.baudRate} ${this.portName}  ${this.machineId.machineId} ${this.machineId.otp} ` });
    console.log('Starting ADH814');


    this.serial = await this.vendingIndex.initADH814(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    } else {

      const swapAndTwoWireMode = localStorage.getItem('swapAndTwoWireMode') ? 'true' : 'false';
      if (swapAndTwoWireMode !== 'true' || !swapAndTwoWireMode) {

        setTimeout(() => {
          this.vendingIndex.adh814.setSwap();
          console.log('set swap');
          Toast.show({ text: 'Swap enabled', duration: 'long' });
        }, 5000);


        this.vendingIndex.adh814.setTwoWires();
        console.log('swapAndTwoWireMode', swapAndTwoWireMode);
        Toast.show({ text: 'Swap and Two Wire Mode enabled', duration: 'long' });
        localStorage.setItem('swapAndTwoWireMode', 'true');
      } else {
        setTimeout(() => {
          this.vendingIndex.adh814.setTemperature(0x01, this.tempStatus.lowTemp);
          console.log('set temp', this.tempStatus.lowTemp);
          Toast.show({ text: 'Set Temperature to ' + this.tempStatus.lowTemp, duration: 'long' });
        }, 20000);


      }

      this.serial.getSerialEvents().subscribe(async (event: any) => {
        try {
          if (event?.event === 'dataReceived') {
            const rawData = event?.data;
            // this.addLogMessage(`Raw data: ${rawData}`);
            console.log('ADH814 Received from device:', rawData);
            if (rawData) {
              const result = this.processResponseADH814(rawData);
              if (result && result.command !== EMACHINE_COMMAND.READ_EVENTS) {
                // this.addLogMessage(`Processed response: ${JSON.stringify(result || {})}`);
              }

              this.sendStatus(JSON.stringify(result?.data), new Date().getTime(), EMACHINE_COMMAND.ADH814_STATUS);
              console.log('ADH814 Processed response:', result);
              if (result?.status == 1) {
                this.apiService.setLastSerialAction();
              }
            }
            else {
              console.error('Serial event:', event);

            }
            if (event?.event === 'nv9Event') {
              this.handleNV9Event(event?.data);
            }

          }
        } catch (error) {
          console.error('Error processing ADH814 event:', error);
        }

      });
    }
    this.vlog.log = this.serial.log;
  }
  private handleFatalError() {
    console.error('CRITICAL COMMUNICATION ERROR - EXITING APPLICATION');
    //Replace with your actual exit method
    // if (typeof App !== 'undefined') {
    //   this.apiService.exitApp();

    // } else if (typeof process !== 'undefined') {
    //   this.apiService.exitApp();
    // }
  }
  private processResponseADH814(rawData: string): IResModel {
    try {
      const hexData = rawData?.replace(/\s/g, '').toLowerCase();
      console.log(`Raw response: ${hexData}`);
      console.log(`Raw data: ${hexData}`);

      if (hexData.length > 44) {
        console.error(`FATAL: Response too long (${hexData.length} bytes > 44). Controller error.`);
        this.apiService.IndexedLogDB.addBillProcess({ errorData: hexData + '' });
        this.handleFatalError();
        return { command: '', status: 0, data: { rawData }, message: 'Response too long - hardware error', transactionID: 0 };
      }
      if (hexData.length < 8) {
        console.log(`Invalid response: Too short (${hexData.length / 2} bytes)`);
        return { command: '', status: 0, data: { rawData }, message: 'Invalid response: Too short', transactionID: 0 };
      }

      const address = parseInt(hexData.slice(0, 2), 16);
      const command = parseInt(hexData.slice(2, 4), 16);

      const data = hexData.slice(4, -4).match(/.{2}/g) || [];




      if (command !== 0xA1 && address !== 0x00) {
        console.log(`Invalid address for command 0x${command.toString(16)}: Expected 0x00, got 0x${address.toString(16)}`);
        return { command: '', status: 0, data: { rawData }, message: 'Invalid address', transactionID: 0 };
      }
      if (command === 0xA1 && (address < 0x01 || address > 0x04)) {
        console.log(`Invalid address for command 0xA1: Expected 0x01-0x04, got 0x${address.toString(16)}`);
        return { command: '', status: 0, data: { rawData }, message: 'Invalid address', transactionID: 0 };
      }

      let result: IResModel;//IResModel;
      switch (command) {
        case 0xA1: // Request ID
          if (data.length !== 16) {
            (`Invalid ID response: Expected 16 data bytes, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.READ_ID, status: 0, data: { rawData }, message: 'Invalid ID response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.READ_ID,
            status: 1,
            data: { firmwareVersion: data.map(byte => String.fromCharCode(parseInt(byte, 16))).join('').trim(), rawData },
            message: 'ID retrieved successfully',
            transactionID: 0
          };
          console.log(`Device ID: ${result.data.firmwareVersion}`);
          break;
        case 0xA2: // Scan Door Feedback
          if (data.length !== 18) {
            console.log(`Invalid SCAN response: Expected 18 data bytes, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.SCAN_DOOR, status: 0, data: { rawData }, message: 'Invalid SCAN response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SCAN_DOOR,
            status: 1,
            data: { doorFeedback: data.map(byte => parseInt(byte, 16), rawData) },
            message: 'Scan door feedback retrieved successfully',
            transactionID: 0
          };
          console.log(`Door feedback: ${JSON.stringify(result.data.doorFeedback)}`);
          break;
        case 0xA3: // Poll Status
          if (data.length !== 9) {
            console.log(`Invalid POLL status data length: ${data.length}`);
            result = { command: EMACHINE_COMMAND.READ_EVENTS, status: 0, data: { rawData }, message: 'Invalid POLL status data length', transactionID: 0 };
            break;
          }
          const statusData = data.map(byte => parseInt(byte, 16));
          result = {
            command: EMACHINE_COMMAND.READ_EVENTS,
            status: 1,
            data: {
              status: statusData[0],
              motorNumber: statusData[1],
              executionResult: statusData[2],
              dropSuccess: !(statusData[2] & 0x04),
              faultCode: statusData[2] & 0x03,
              maxCurrent: (statusData[3] << 8) | statusData[4],
              avgCurrent: (statusData[5] << 8) | statusData[6],
              runTime: statusData[7],
              temperature: statusData[8] > 127 ? statusData[8] - 256 : statusData[8],
              rawData
            },
            message: 'Poll status retrieved successfully',
            transactionID: 0
          };
          console.log(`Poll status: Motor ${result.data.motorNumber}, Status ${result.data.status}, Drop ${result.data.dropSuccess ? 'Success' : 'Failed'}, Temp ${result.data.temperature}°C`);
          if (result.data.temperature === -40) {
            console.log('Temperature sensor disconnected');
          } else if (result.data.temperature === 120) {
            console.log('Temperature sensor shorted');
          }
          if (result.data.faultCode !== 0) {
            console.log(`Fault code: ${result.data.faultCode === 1 ? 'Overcurrent' : result.data.faultCode === 2 ? 'Open circuit' : 'Timeout'}`);
          }
          this._machineStatus.status.temp = result.data.temperature;
          this.machinestatus.data = result.data;
          // this.sendStatus();


          break;
        case 0xA4: // Set Temperature
          if (data.length !== 3) {

            result = { command: EMACHINE_COMMAND.SET_TEMP, status: 0, data: { rawData }, message: 'Invalid TEMP response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SET_TEMP,
            status: 1,
            data: {
              mode: parseInt(data[0], 16),
              tempValue: (parseInt(data[1], 16) << 8) | parseInt(data[2], 16),
              rawData
            },
            message: 'Temperature set successfully',
            transactionID: 0
          };

          break;
        case 0xA5: // Start Motor
          if (data.length !== 1) {

            result = { command: EMACHINE_COMMAND.shippingcontrol, status: 0, data: { rawData }, message: 'Invalid RUN response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.shippingcontrol,
            status: parseInt(data[0], 16) === 0 ? 1 : 0,
            data: { executionStatus: parseInt(data[0], 16), rawData },
            message: parseInt(data[0], 16) === 0 ? 'Motor started successfully' : `Motor error: Code ${parseInt(data[0], 16)}`,
            transactionID: 0
          };

          break;
        case 0xB5: // Start Motor Combined
          if (data.length !== 1) {

            result = { command: EMACHINE_COMMAND.START_MOTOR_MERGED, status: 0, data: { rawData }, message: 'Invalid RUN2 response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.START_MOTOR_MERGED,
            status: parseInt(data[0], 16) === 0 ? 1 : 0,
            data: { executionStatus: parseInt(data[0], 16), rawData },
            message: parseInt(data[0], 16) === 0 ? 'Merged motor started successfully' : `Merged motor error: Code ${parseInt(data[0], 16)}`,
            transactionID: 0
          };

          break;
        case 0xA6: // Acknowledge Result
          if (data.length !== 0) {

            result = { command: EMACHINE_COMMAND.CLEAR_RESULT, status: 0, data: { rawData }, message: 'Invalid ACK response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.CLEAR_RESULT,
            status: 1,
            data: { acknowledged: true, rawData },
            message: 'Result acknowledged successfully',
            transactionID: 0
          };

          break;
        default:

          result = { command: '', status: 0, data: { rawData }, message: 'Unsupported command', transactionID: 0 };
      }
      return result;
    } catch (error: any) {

      return { command: '', status: 0, data: {}, message: `Error processing response: ${error.message}`, transactionID: 0 };
    }
  }


  // async startM102() {

  //   await this.serial?.close();
  //   this.serial = null;

  //   this.serial = await this.vendingIndex.initM102(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }

  async runtoast(txt: string, duration: number = 1000) {
    const t = this.apiService.toast.create({ message: `--> ${txt}`, duration: duration });
    (await t).present();
  }


  private processVMCResponse(hex: string): void {
    const t = Number('-21' + Date.now());

    if (hex.startsWith('fafb04')) {
      const t = Number('-21' + Date.now());
      console.log('Dispensing status:', hex);
      //FA FB 06 05 A6 01 00 00 3C 99 ==> 3C is 60 slot sent command
      if (hex.substring(10, 12) == '01') { console.log('Dispensing'); this.sendStatus(hex, t, EMACHINE_COMMAND.VMC_DISPENSE); Toast.show({ text: 'Dispensing' }); }
      if (hex.substring(10, 12) == '02') { console.log('Dispensed'); this.sendStatus(hex, t, EMACHINE_COMMAND.VMC_DISPENSED); Toast.show({ text: 'Dispensed' }); }
      if (hex.substring(10, 12) == '03') { console.log('Drop failed'); this.sendStatus(hex, t, EMACHINE_COMMAND.VMC_DISPENSEFAILED); Toast.show({ text: 'Drop failed' }); }

      // FA FB 04 04 A3 01 00 3C 9F ==> 3C is 60 slot sent command, 01 = status processing
      // FA FB 04 04 A4 02 00 3C 9B ==> 3C is 60 slot sent command, 02 = status dispensed
      // fa fb 04 04 9e 03 00 3c a0 ==> 3C is 60 slot sent command, 03 = status drop failed

    } else if (hex.startsWith('fafb21')) { // process credit note with bank note value
      console.log('receive banknotes 21', hex);
      const mode = hex.substring(10, 12);
      if (mode === '01') { //fafb21069101 ==> 01 receive
        // banknote receive
        const value = this.getNoteValue(hex) / 100;
        const t = Number('-21' + Date.now());
        // this.apiService.alert.create({
        //   header: 'Banknote received',
        //   message: `Banknote received: ${value}`,
        //   buttons: ['OK'] //, 'Cancel'
        // }).then(r => r.present());
        if (this.firstCredit) { this.firstCredit = false; return; }
        if (this.offlineMode) {

          this.apiService.updateNewLocalBalance(value + '');
        } else {
          const hash = cryptojs.SHA256(this.machineId.machineId + value).toString(cryptojs.enc.Hex);
          const credit: ICreditData = {
            id: -1,
            name: 'credit',
            data: { raw: hex, data: hash, t: Date.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.VMC_CREDIT_NOTE },
            transactionID: t.toString(),
            description: ''
          };

          this.creditPending.push(credit);
          this.addOrUpdateCredit(credit);

          // check Hashing 
          const bn = this.initHashBankNotes(this.machineId.machineId);
          const note = bn.find(v => v.hash === hash);
          if (!note) {
            console.log('Hash not found', hash);
            return;
          } else {
            /// send to server and need to confirm from server
            this.sendStatus(hash, t, EMACHINE_COMMAND.VMC_CREDIT_NOTE);
          }
        }



        // fafb2106d501 000186a0 d5 == 100000 == 1000,00
        //               // fafb21069101 000186a0 91 == 100000 == 1000,00
        //               // fafb2106c301 00030d40 aa == 200000 == 2000,00
        //               // fafb21065401 0007a120 f5 == 500000 == 5000,00
        //               // fafb21065701 000f4240 7d == 1000000 == 10000,00
        //               // fafb21064a01 000f4240 60
        //               // fafb21060701 001e8480 3a == 2000000 == 20000,00
        //               // fafb2106bf01 001e8480 82
        //               // fafb21066001 004c4b40 00 == 5000000 == 50000,00
        //               // new 50k not working
        //               // fafb21067c01 00989680 d5 == 10000000 == 100000,00
        //               // new 100k not working
        // const hash = cryptojs.SHA256(this.sock.machineId + value).toString(cryptojs.enc.Hex);
        // const credit: ICreditData = {
        //   id: -1,
        //   name: 'credit',
        //   data: { raw: hex, data: hash, t: Date.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.CREDIT_NOTE },
        //   transactionID: t.toString(),
        //   description: ''
        // };
        // this.creditPending.push(credit);
        // this.addOrUpdateCredit(credit);
        // this.sock.send(hash, t, EMACHINE_COMMAND.CREDIT_NOTE);
      } else if (mode == '08') {//fafb21068308000186a08a
        //bank note swollen
        Toast.show({ text: 'Banknote swollen' });
        this.sendStatus(hex, t, EMACHINE_COMMAND.VMC_BANK_SWALLOWED);
      }
    } else if (hex.startsWith('fafb23')) {
      console.log('receive banknotes 23-----------------------------------------------------------------------------', hex);
      // const now = Date.now();
      // if (this.lastReported23 && hex === this.lastReported23.hex && (now - this.lastReported23.timestamp < 1000)) {
      //   console.log('Ignoring duplicate 0x23:', hex);
      //   return;
      // }
      // this.lastReported23 = { hex, timestamp: now };

      // const amountHex = hex.substring(8, 16);
      // const amountDecimal = parseInt(amountHex.match(/.{2}/g).reverse().join(''), 16) / 100;
      // this.balance = amountDecimal; // Track balance in your app
      // console.log('Updated credit balance:', this.balance);
      // this.sock.send(hex, -23, EMACHINE_COMMAND.CREDIT_NOTE);

      // // Deduct credit immediately with mode 1 (bill)
      // this.serialService.writeVMC(EVMC_COMMAND._27, { mode: 1, amount: amountHex });
    } else if (hex.startsWith('fafb52')) {// status to server and update and local
      //fafb5221b5000000000000000000000000000030303030303030303030aaaaaaaaaaaaaaaac7
      // this.machinestatus.data = hex; 
      // this.machinestatus.data = hex;
      // this._machineStatus.status = hex
      const resultStatus = machineVMCStatus(hex);
      this._machineStatus.status.temp = resultStatus.temperature + '';
      // console.log('******machine status:', resultStatus);

      this.machinestatus.data = hex;
      // const m = machineVMCStatus(hex);
      this.sendStatus(hex, t, EMACHINE_COMMAND.VMC_MACHINE_STATUS);
      // this.apiService.alert.create({
      //   header: 'Machine Status',
      //   message: JSON.stringify(resultStatus),
      //   buttons: ['OK']
      // }).then(r => r.present());

      // this._machineStatus = resultStatus;

    } else {
      this.sendStatus(hex, t, EMACHINE_COMMAND.VMC_UNKNOWN);
      this.apiService.IndexedLogDB.addBillProcess({ errorData: hex })
      console.log('Unhandled response:', hex);
    }
  }


  private getNoteValue(b: string) {
    try {
      return this.hex2dec(b?.substring(12, 20));
    } catch (error) {
      return -1;
    }
  }

  private hex2dec(hex: string) {
    try {
      return parseInt(hex, 16);
    } catch (error) {
      return -1;
    }

  }
  loadAutoShowMyOrders() {
    if (this.orders != undefined && Object.entries(this.orders).length > 0 && this.checkAppUpdate == false) {
      this.autoShowMyOrderTimer = setInterval(() => {
        this.autoShowMyOrdersCounter--;
        if (this.autoShowMyOrdersCounter <= 0) {
          clearInterval(this.autoShowMyOrderTimer);
          // this.showMyOrdersModal();
          this.clearCart();
          console.log('CLEAR STOCK');

        }
      }, 1000);
    }
  }
  reloadAutoPayment() {
    if (this.orders != undefined && Object.entries(this.orders).length > 0 && this.checkAppUpdate == false) {
      this.autoShowMyOrdersCounter = 15;
    }
  }

  // getToTestMotorPage(i: string) {
  //   let data = {
  //     action: i
  //   }
  //   this.showModal(TestmotorPage, data, 'dialog-fullscreen').then(r => {
  //     r.present();
  //     r.onDidDismiss().then(res => {
  //       if (res.data.reload) {
  //       }
  //     })
  //   })
  // }

  toggleWebviewTab(e: any) {
    // console.log(e.detail);
    if (e.detail.scrollTop > 126) {
      this.apiService.toggleWebviewTab = true;
    } else {
      this.apiService.toggleWebviewTab = false;
    }
  }
  setActive() {
    console.log('active');
    this._checkHowTo_Time = this._checkHowTo_Duration;
  }

  // autoUpdateCash() {
  //   this.WSAPIService.balanceUpdateSubscription.subscribe(async (r) => {
  //     if (r) {
  //       await this.initVendingWalletCoinBalance();
  //     }
  //   });
  // }

  refreshAllEveryHour() {
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.refreshAll = setInterval(() => {
      const now = Date.now();
      if (now - this.lastUpdate >= tenMinutes || (now - this.lastAction >= tenMinutes)) {
        clearInterval(this.refreshAll);
        this.refreshAllCounter = 0;
        this.lastUpdate = now; // Update lastUpdate to current time
        this.refresh();
      }
    }, 1000 * 60); // Check every minutes
  }
  refresh() {
    // window.location.reload();
    this.apiService.reloadPage();
  }
  forceReload() {
    // this.count++;
    // if (!this.t) {
    //   this.t = setTimeout(() => {
    //     this.count = 0;
    //     this.t = null;
    //   }, 2000);
    // }
    // if (this.count >= 6) {
    //   this.refresh();
    //   this.count = 0;
    //   if (this.t) {
    //     clearTimeout(this.t);
    //     this.t = null;
    //   }
    // }
  }
  initStock() {
    // if (this.vendingOnSale?.length) return;
    this.apiService.loadVendingSale().then((rx) => {
      const r = rx.data;
      try {
        console.log('initStock');

        console.log(`load vending sale`, r.data);
        if (r.status) {
          const saleServer = r.data as Array<IVendingMachineSale>;
          console.log('saleServer', saleServer);

          this.apiService.newProductItems(saleServer);
          // saleServer.forEach(async (v,i)=>{
          //   setTimeout(async () => {
          //     await this.apiService.saveImage(v.stock.id,v.stock.image);
          //   }, 100*i);

          // })
          // window.location.reload();
          // this.initVendingWalletCoinBalance().then(() => { });
          this.storage.get('saleStock', 'stock').then((s) => {
            try {
              console.log(`storage get`, s);

              const saleitems = JSON.parse(
                JSON.stringify(s?.v ? s.v : [])
              ) as Array<IVendingMachineSale>;

              // console.log(`sale server`, JSON.stringify(saleServer.map(item => { return { uuid: item.stock.uuid } })));

              console.log(`saleitems`, saleitems);

              // reset everytime ws activate
              // console.log(' this.vendingOnSale.length 1', this.vendingOnSale.length);

              if (this.vendingOnSale?.length) this.vendingOnSale.length = 0;

              if (this.saleList?.length) this.saleList.length = 0;

              // console.log(' this.vendingOnSale.length 2', this.~vendingOnSale.length);
              // console.log(`sale list der 1`, this.saleList.length);

              this.vendingOnSale.push(...saleitems);
              this.saleList.push(...this.vendingOnSale);
              if (this.saleList[0]?.position == 0) this.compensation = 1;
              this.saleList.sort((a, b) => {
                if (a.position < b.position) return -1;
              });
              console.log(`sale list der ni`, this.saleList);


              console.log(`sale list der 2`, this.saleList.length);
            } catch (error) {
              console.log('error', error);
            }
          });
        } else {
          alert(r.message);
        }
      } catch (error) {
        console.log('error', error);
      }
    });
  }

  loadBrightness(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        // const run = await ScreenBrightness.setBrightness({ brightness: 1 });
        // this.apiService.toast.create({ message: `--> set brightness ${run}`, duration: 2000 }).then(r => r.present());

        // const {brightness: currentBrightness} = await ScreenBrightness.getBrightness();
        // const brightness = await ScreenBrightness.getBrightness();
        // this.apiService.alertSuccess(`--> bright ${brightness}`)

        resolve(IENMessage.success);

      } catch (error: any) {
        resolve(error.message);
      }
    });
  }
  setBrightness(level = 1): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (level < 0 || level > 1) level = 1;
        if (level == null || level == undefined) level = 1;
        if (isNaN(level)) level = 1;
        // if (level == (await ScreenBrightness.getBrightness())?.brightness) {
        //   resolve(IENMessage.success);
        //   return;
        // }
        // const run = await ScreenBrightness.setBrightness({ brightness: level });
        // this.apiService.alertSuccess(`--> set brightness ${run}`)

        resolve(IENMessage.success);

      } catch (error: any) {
        resolve(error.message);
      }
    });
  }


  loadStock(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {


        // 100 x 240

        // await this.cashingService.remove(this.ownerUuid);
        // return resolve(IENMessage.success);

        // save image
        const params = {
          ownerUuid: this.ownerUuid,
          filemanagerURL: this.filemanagerURL,
        };
        console.log(`params`, params);
        const run = await this.loadStockListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        // fix
        // this.FakeWriteAPPVERSION();
        this.APPVERSION();

        this.apiService.newProductItems(run.data[0].lists);
        this.apiService.imageList = run.data[0].imageObject;

        const s = await this.storage.get('saleStock', 'stock');
        const saleitems = JSON.parse(
          JSON.stringify(s?.v ? s.v : [])
        ) as Array<IVendingMachineSale>;
        console.log(`saleitems`, saleitems);

        if (this.vendingOnSale?.length) this.vendingOnSale.length = 0;
        if (this.saleList?.length) this.saleList.length = 0;

        // const initVendingWalletCoinBalance =
        //   // await this.initVendingWalletCoinBalance();
        // if (initVendingWalletCoinBalance != IENMessage.success)
        //   throw new Error(initVendingWalletCoinBalance);
        if (saleitems.length) {
          this.vendingOnSale.push(...saleitems);
          this.saleList.push(...this.vendingOnSale);
          if (this.saleList[0]?.position == 0) this.compensation = 1;

          this.saleList.sort((a, b) => {
            if (a.position < b.position) return -1;
          });
          // setTimeout(() => {
          // this.showBills();
          // }, 10000);

          resolve(IENMessage.success);
        } else {
          this.apiService.recoverSale().then((rx) => {
            const r = rx.data;
            // console.log(r);
            if (r.status) {
              ApiService.vendingOnSale.length = 0;
              console.log('recover', r.data);

              ApiService.vendingOnSale.push(...r.data);
              this.saleList.push(...this.vendingOnSale);
              if (this.saleList[0]?.position == 0) this.compensation = 1;
              this.saleList.sort((a, b) => {
                if (a.position < b.position) return -1;
              });
              // setTimeout(() => {
              //   this.showBills();
              // }, 10000);

              this.storage.set('saleStock', ApiService.vendingOnSale, 'stock');

              resolve(IENMessage.success);
            }
            this.apiService.toast
              .create({ message: r.message, duration: 200 })
              .then((r) => {
                r.present();
              });
          });
        }
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  endCount() {
    if (this.timeoutHandler) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
    if (this.manageStockCount >= 3) {
      this.manageStock();
    }
    this.manageStockCount = 0;
  }
  holdCount() {
    this.timeoutHandler = setInterval(() => {
      ++this.manageStockCount;
    }, 1000);
  }

  async showQrAlert() {
    const m = await this.apiService.showModal(QrOpenStockPage);
    m?.present();
    this.isOpenStock = true;
    m?.onDidDismiss().then((r) => {
      this.isOpenStock = false;
    });

  }

  async showTopup() {
    // if (this.apiService.allowTopUp) {
    //   const m = await this.apiService.showModal(GivePopUpPage);
    //   m.present();
    //   m.onDidDismiss().then((r) => {
    //     console.log('-----> GO TO DROP');

    //   });
    // }

  }
  private async promptPassword(length = 12): Promise<string | null> {
    const modal = await this.modalCtrl.create({
      component: NumpadModalComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 1],
      componentProps: {
        title: 'Password Required',
        subtitle: 'Enter your 12-digit Password',
        length,
      },
    });

    this.numpadModal = modal;
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (this.numpadModal === modal) {
      this.numpadModal = undefined;
    }
    return role === 'confirm' ? data : null;
  }

  async closeNumpadModalIfOpen() {
    if (!this.numpadModal) return;

    const modal = this.numpadModal;
    this.numpadModal = undefined;

    try {
      await modal.dismiss(null, 'cancel');
    } catch (error) {
      console.log('closeNumpadModalIfOpen', error);
    }
  }

  async manageStock() {
    if (this.qrMode) {
      if (this.apiService.secret) {
        this.showQrAlert();
      }
      return;
    }
    const x = await this.promptPassword();
    console.log(x, this.getPassword());

    // if (environment.production)
    if (
      !this.getPassword().endsWith(x?.substring(6) || '') ||
      !x?.startsWith(this.machineId?.otp) ||
      x?.length < 12
    )
      return;
    this.openManageStock();
  }

  async openManageStock() {
    try {
      const m = await this.apiService.showModal(StocksalePage, {}, false) || {} as HTMLIonModalElement;
      this.checkActiveModal(m);

      m.onDidDismiss().then((r) => {
        const d = r?.data as { resetCashCount: boolean };
        console.log('manageStock', r.data);
        // if (r.data) {
        const k = 'refillSaleStock';
        this.storage.get(k + '_', k).then((rx) => {
          const b = rx.v as Array<IVendingMachineSale>;
          const s = b ? b : [];
          const u = new Date();
          this.vendingOnSale.forEach((v) => (v.updatedAt = u));
          s.unshift(...this.vendingOnSale);
          this.storage.set(k + '_', s, k);
        });
        if (d?.resetCashCount) {
          this.resetCashAcceptor();
        }
      });
      m.present();
      this.otherModalAreOpening = true;
      this.openAnotherModal(m);
    } catch (error) {

    }
  }

  async manageStockByQR() {

    const m = await this.apiService.showModal(StocksalePage, {}, true, 'customModalQRStock');
    this.checkActiveModal(m);

    m?.onDidDismiss().then((r) => {
      r.data;
      console.log('manageStock', r.data);
      // if (r.data) {
      const k = 'refillSaleStock';
      this.storage.get(k + '_', k).then((rx) => {
        const b = rx.v as Array<IVendingMachineSale>;
        const s = b ? b : [];
        const u = new Date();
        this.vendingOnSale.forEach((v) => (v.updatedAt = u));
        s.unshift(...this.vendingOnSale);
        this.storage.set(k + '_', s, k);


      });


    });
    m?.present();
    this.otherModalAreOpening = true;
    this.openAnotherModal(m);

  }
  processLoadedPaidBills = false;
  async loadPaidBills() {
    if (this.processLoadedPaidBills) return;
    this.processLoadedPaidBills = true;

    const data = await this.apiService.IndexedDB.getBillProcesses() ?? [];
    if (data.length > 0) {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Click loadPaidBills Local ${JSON.stringify(data)}` });
      this.showBills();
      this.processLoadedPaidBills = false;
      return;
    }

    this.apiService.loadPaidBills().then(async re => {
      const r = re.data;
      console.log(`Load paid bills`, JSON.stringify(r || {}));
      Toast.show({ text: `Load paid bills ${r?.data?.length}`, duration: 'short' });

      if (!r.data.length) {
        this.apiService.IndexedLogDB.addBillProcess({ errorData: `Click loadPaidBills Server ${JSON.stringify(r.data)}` });

        this.showBills();
      }
      const m = await this.apiService.showModal(BillNotDropPage, {}, true, 'customModalLarge');
      if (m) {
        m.present();
        let timeout: any;
        const resetTimeout = () => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            m.dismiss();
          }, 20000);
        };

        const events = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
        const eventHandler = () => resetTimeout();

        events.forEach(event => document.addEventListener(event, eventHandler, true));
        resetTimeout();

        m.onDidDismiss().then(() => {
          if (timeout) clearTimeout(timeout);
          events.forEach(event => document.removeEventListener(event, eventHandler, true));
        });
      }
    }).catch(er => {
      console.log(er);
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error Click loadPaidBills ${JSON.stringify(er)}` });

      Toast.show({ text: `Load paid bills error ${er.message}` });
    }).finally(() => {
      console.log('finally');
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `finally Click loadPaidBills` });
      Toast.show({ text: `Load paid bills finally`, duration: 'short' });
      this.processLoadedPaidBills = false;
    });
  }
  // loadBills() {
  //   this.apiService.loadBills().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingBill.push(...r.data);
  //     }
  //   })
  // }


  async showGetCouponPromotion() {
    try {
      this.apiService.showModal(GetCouponPromotionPage).then(r => {
        r?.present();
      })
    } catch (error) {

    }
  }

  loadOnlineMachine() {
    this.apiService.loadOnlineMachine().then((rx) => {
      const r = rx.data;

      console.log(r);
      if (r.status) {
        this.onlineMachines.push(...r.data);
      }
    });
  }
  // loadSaleList() {
  //   this.apiService.loadSaleList().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingOnSale.length=0;
  //       this.saleList.length=0;
  //       this.vendingOnSale.push(...r.data);
  //       console.log('VENDING ON SALE', this.vendingOnSale);
  //       this.saleList.push(...this.getSaleList());
  //     }
  //   })
  // }

  // buyMMoney(x: IVendingMachineSale) {
  //   if (!x) return alert('not found');
  //   // if (x.stock.qtty <= 0) alert('Out Of order');
  //   this.apiService.showLoading();
  //   if (x.stock.price == 0) {
  //     this.apiService.getFreeProduct(x.position, x.stock.id).subscribe((r) => {
  //       console.log(r);
  //       if (r.status) {
  //         this.apiService.toast
  //           .create({ message: r.message, duration: 2000 })
  //           .then((r) => {
  //             r.present();
  //             this.otherModalAreOpening = true;
  //             this.openAnotherModal(r);

  //             const y = ApiService.vendingOnSale.find(
  //               (v) => v.position == x.position
  //             );
  //             y.stock.qtty--;
  //             console.log('yyyyy', y, x);

  //             this.storage.set('bill_' + new Date().getTime(), y, 'bills');
  //             // PLAY SOUNDS
  //             this.storage.set('saleStock', ApiService.vendingOnSale, 'stock');
  //           });
  //       } else {
  //         this.apiService.toast
  //           .create({ message: r.message, duration: 5000 })
  //           .then((r) => {
  //             r.present();
  //           });
  //       }
  //       setTimeout(() => {
  //         this.apiService.soundThankYou();
  //         this.apiService.dismissLoading();
  //       }, 3000);
  //     });
  //   } else {
  //     const amount = x.stock.price * 1;

  //     this.apiService
  //       .buyMMoney([x], amount, this.machineId.machineId)
  //       .subscribe((r) => {
  //         console.log(r);
  //         if (r.status) {
  //           this.bills = r.data as IVendingMachineBill;
  //           // localStorage.setItem('order', JSON.stringify(this.bills));
  //           this.storage.set(
  //             'order_' + new Date().getTime(),
  //             this.bills,
  //             'orders'
  //           );
  //           new qrlogo({
  //             logo: '../../assets/icon/mmoney.png',
  //             content: this.bills.qr,
  //           })
  //             .getCanvas()
  //             .then((r) => {
  //               this.apiService.modal
  //                 .create({
  //                   component: QrpayPage,
  //                   componentProps: {
  //                     encodedData: r.toDataURL(),
  //                     amount,
  //                     ref: this.bills.paymentref,
  //                   },
  //                   cssClass: 'dialog-fullscreen',
  //                 })
  //                 .then((r) => {
  //                   r.present();
  //                   this.otherModalAreOpening = true;
  //                   this.checkActiveModal(r);
  //                   this.openAnotherModal(r);

  //                 });
  //             });

  //           // this.scanner.encode(this.scanner.Encode.TEXT_TYPE, this.bills.qr).then(
  //           //   res => {
  //           //     console.log(res);
  //           //     this.modal.create({ component: QrpayPage, componentProps: { encodedData: res } }).then(r => {
  //           //       r.present();
  //           //     })
  //           //   }, error => {
  //           //     alert(error);
  //           //   }
  //           // );
  //         } else {
  //           this.apiService.toast
  //             .create({ message: r.message, duration: 5000 })
  //             .then((r) => {
  //               r.present();
  //             });
  //         }
  //         setTimeout(() => {
  //           this.apiService.dismissLoading();
  //         }, 1000);
  //       });
  //   }
  // }


  buyLaoQR(x: IVendingMachineSale) {
    if (!x) return alert('not found');
    // if (x.stock.qtty <= 0) alert('Out Of order');
    // this.apiService.showLoading(null, 5000);
    if (x.stock.price == 0) {
      this.apiService.getFreeProduct(x.position, x?.stock?.id).then((rx) => {
        const r = rx.data;
        console.log(r);
        if (r.status) {
          this.apiService.toast
            .create({ message: r.message, duration: 2000 })
            .then((r) => {
              r.present();
              this.otherModalAreOpening = true;
              this.openAnotherModal(r);

              const y = ApiService.vendingOnSale.find(
                (v) => v.position == x.position
              ) || { stock: { qtty: 0 } };
              y.stock.qtty--;
              console.log('yyyyy', y, x);

              this.storage.set('bill_' + new Date().getTime(), y, 'bills');
              // PLAY SOUNDS
              this.storage.set('saleStock', ApiService.vendingOnSale, 'stock');
            });
        } else {
          this.apiService.toast
            .create({ message: r.message, duration: 5000 })
            .then((r) => {
              r.present();
            });
        }
        setTimeout(() => {
          this.apiService.soundThankYou();
          // this.apiService.dismissLoading();
        }, 3000);
      });
    } else {
      const amount = x.stock.price * 1;

      this.apiService
        .buyLaoQR([x], amount)
        .then((rx) => {
          const r = rx.data;
          console.log(r);
          if (r.status) {
            this.bills = r.data as IVendingMachineBill;
            // localStorage.setItem('order', JSON.stringify(this.bills));
            this.storage.set(
              'order_' + new Date().getTime(),
              this.bills,
              'orders'
            );
            new qrlogo({
              logo: '../../assets/icon/mmoney.png',
              content: this.bills.qr,
            })
              .getCanvas()
              .then((r) => {
                this.apiService.modalCtrl
                  .create({
                    component: QrpayPage,
                    componentProps: {
                      encodedData: r.toDataURL(),
                      amount,
                      ref: this.bills.paymentref,
                    },
                    cssClass: 'dialog-fullscreen',
                  })
                  .then((r) => {
                    r.present();
                    this.otherModalAreOpening = true;
                    this.checkActiveModal(r);
                    this.openAnotherModal(r);

                  });
              });

            // this.scanner.encode(this.scanner.Encode.TEXT_TYPE, this.bills.qr).then(
            //   res => {
            //     console.log(res);
            //     this.modal.create({ component: QrpayPage, componentProps: { encodedData: res } }).then(r => {
            //       r.present();
            //     })
            //   }, error => {
            //     alert(error);
            //   }
            // );
          } else {
            this.apiService.toast
              .create({ message: r.message, duration: 5000 })
              .then((r) => {
                r.present();
              });
          }
          setTimeout(() => {
            // this.apiService.dismissLoading();
          }, 1000);
        });
    }
  }
  // buyManyMMoney() {
  //   if (!this.orders.length) return alert('Please add any items first');
  //   const amount = this.orders.reduce(
  //     (a, b) => a + b.stock.price * b.stock.qtty,
  //     0
  //   );
  //   // console.log('ids', this.orders.map(v => { return { id: v.stock.id + '', position: v.position } }));
  //   this.apiService.showLoading();
  //   console.log(this.orders, amount);
  //   this.apiService
  //     .buyMMoney(this.orders, amount, this.machineId.machineId)
  //     .subscribe((r) => {
  //       console.log(r);
  //       if (r.status) {
  //         this.bills = r.data as IVendingMachineBill;
  //         localStorage.setItem('order', JSON.stringify(this.bills));
  //         new qrlogo({
  //           logo: '../../assets/icon/mmoney.png',
  //           content: this.bills.qr,
  //         })
  //           .getCanvas()
  //           .then((r) => {
  //             this.apiService.modal
  //               .create({
  //                 component: QrpayPage,
  //                 componentProps: {
  //                   encodedData: r.toDataURL(),
  //                   amount,
  //                   ref: this.bills.paymentref,
  //                 },
  //                 cssClass: 'dialog-fullscreen',
  //               })
  //               .then((r) => {
  //                 r.present();
  //                 this.otherModalAreOpening = true;
  //                 this.checkActiveModal(r);
  //                 this.openAnotherModal(r);

  //               });
  //           });
  //         // this.scanner.encode(this.scanner.Encode.TEXT_TYPE, this.bills.qr).then(
  //         //   res => {
  //         //     console.log(res);
  //         //     this.modal.create({ component: QrpayPage, componentProps: { encodedData: res } }).then(r => {
  //         //       r.present();
  //         //     })
  //         //   }, error => {
  //         //     alert(error);
  //         //   }
  //         // );
  //       }
  //       this.apiService.dismissLoading();
  //       this.getTotalSale.q = 0;
  //       this.getTotalSale.t = 0;
  //       // this.orders = [];
  //       this.summarizeOrder = [];
  //     });
  // }


  buyManyLaoQR() {
    if (!this.orders.length) return alert('Please add any items first');
    const amount = this.orders.reduce(
      (a, b) => a + b.stock.price * b.stock.qtty,
      0
    );
    // console.log('ids', this.orders.map(v => { return { id: v.stock.id + '', position: v.position } }));
    // this.apiService.showLoading(null, 5000);
    console.log(this.orders, amount);
    this.apiService
      .buyLaoQR(this.orders, amount)
      .then((rx) => {
        const r = rx.data;
        console.log(r);
        if (r.status) {
          this.bills = r.data as IVendingMachineBill;
          localStorage.setItem('order', JSON.stringify(this.bills));
          new qrlogo({
            logo: '../../assets/icon/mmoney.png',
            content: this.bills.qr,
          })
            .getCanvas()
            .then((r) => {
              this.apiService.modalCtrl
                .create({
                  component: QrpayPage,
                  componentProps: {
                    encodedData: r.toDataURL(),
                    amount,
                    ref: this.bills.paymentref,
                  },
                  cssClass: 'dialog-fullscreen',
                })
                .then((r) => {
                  r.present();
                  this.otherModalAreOpening = true;
                  this.checkActiveModal(r);
                  this.openAnotherModal(r);

                });
            });
          // this.scanner.encode(this.scanner.Encode.TEXT_TYPE, this.bills.qr).then(
          //   res => {
          //     console.log(res);
          //     this.modal.create({ component: QrpayPage, componentProps: { encodedData: res } }).then(r => {
          //       r.present();
          //     })
          //   }, error => {
          //     alert(error);
          //   }
          // );
        }
        // this.apiService.dismissLoading();
        this.getTotalSale.q = 0;
        this.getTotalSale.t = 0;
        // this.orders = [];
        this.summarizeOrder = [];
      });
  }

  localLoad() {
    const orders = localStorage.getItem(IENMessage.vendingPendingOrders);
    const sum = localStorage.getItem(IENMessage.vendingPendingSum);
    return {
      orders: orders == null ? [] : JSON.parse(orders),
      sum: sum == null ? [] : JSON.parse(sum)
    }
  }
  localSave() {
    localStorage.setItem(IENMessage.vendingPendingOrders, JSON.stringify(this.orders));
    localStorage.setItem(IENMessage.vendingPendingSum, JSON.stringify(this.getTotalSale));
  }
  localClear() {
    localStorage.removeItem(IENMessage.vendingPendingOrders);
    localStorage.removeItem(IENMessage.vendingPendingSum);
  }

  async addOrder(x: IVendingMachineSale) {
    try {
      this.lastAction = Date.now();
      this.autopilot.auto = 0;
      if (!this.allowVending) {
        this.apiService.showModal(CloseStytemPage, {}, false, 'full-modal')
          .then(modal => modal?.present());
        return;
      }

      this.setActive();
      if (!x) return alert('not found');
      console.log('-----> addOrder allowTopUp :', this.apiService.allowTopUp);

      const ord = this.orders.filter((v) => v.position == x.position);
      if (ord.length)
        if (ord.length >= x?.stock.qtty) {
          if (this.apiService.allowTopUp) {
            this.showMyOrdersTopUpModal();
          } else {
            this.showMyOrdersModal();
          }
          return this.apiService.toast.create({
            message: 'Out of Stock',
            duration: 2000,
            position: 'middle'
          }).then((r) => r.present());
        }
      //  return alert('Out of Stock');
      // console.log('ID', x);
      // console.log(`getTotalSale`, this.getTotalSale.q, this.getTotalSale.t);


      const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
      y.stock.qtty = 1;
      console.log('y', y);
      this.orders.unshift(y);
      console.log(`orders`, this.orders);

      this.getSummarizeOrder();
      // setTimeout(() => {
      this.showMyOrdersModal();
    } catch (error) {
      console.log('error', error);
      alert(JSON.stringify(error));
    }
  }

  async addOrderTopUp(x: IVendingMachineSale) {
    try {
      this.lastAction = Date.now();
      this.autopilot.auto = 0;
      if (!this.allowVending) {
        this.apiService.showModal(CloseStytemPage, {}, false, 'full-modal')
          .then(modal => modal?.present());
        return;
      }

      this.setActive();
      if (!x) return alert('not found');
      console.log('-----> addOrder Topup allowTopUp :', this.apiService.allowTopUp);

      const ord = this.orders.filter((v) => v.position == x.position);
      if (ord.length)
        if (ord.length >= x?.stock.qtty)
        // return alert('Out of Stock');
        {
          if (this.apiService.allowTopUp) {
            this.showMyOrdersTopUpModal();
          } else {
            this.showMyOrdersModal();
          }
          return this.apiService.toast.create({
            message: 'Out of Stock',
            duration: 2000,
            position: 'middle'
          }).then((r) => r.present());
        }
      console.log('ID', x);
      console.log(`getTotalSale`, this.getTotalSale.q, this.getTotalSale.t);


      const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
      y.stock.qtty = 1;
      y.stock.price = this.calculateTicketValue([{ value: y.stock.price }]);

      console.log('y', y);
      this.orders.unshift(y);
      console.log(`orders`, this.orders);

      this.getSummarizeOrder();
      // setTimeout(() => {
      this.showMyOrdersTopUpModal();
    } catch (error) {
      console.log('error', error);
      alert(JSON.stringify(error));
    }
  }


  addOrderTest(x: IVendingMachineSale) {
    try {
      this.lastAction = Date.now();
      this.autopilot.auto = 0;
      // console.log(`allow vending`, this.allowVending);
      const vending = localStorage.getItem('allowVending') ?? '';
      let allowVending = vending == 'yes' ? true : false;

      if (allowVending == false) {
        // this.apiService.simpleMessage('Vending is closed');
        this.apiService.soundSystemError();
        // const alert = Swal.fire({
        //   icon: 'error',
        //   title: 'Vender is out of service',
        //   text: `Please, try again later`,
        //   showConfirmButton: true,
        //   confirmButtonText: 'OK',
        //   confirmButtonColor: '#EE3124',
        //   heightAuto: false,
        // });
        // setTimeout(() => {
        //   Swal.close();
        // }, 2000);

        this.apiService.alertError('Please, try again later');
        return;
      }

      this.setActive();
      if (!x) return alert('not found');

      const ord = this.orders.filter((v) => v.position == x.position);
      if (ord.length)
        if (ord.length >= x?.stock.qtty)
        //  return alert('Out of Stock');
        {
          if (this.apiService.allowTopUp) {
            this.showMyOrdersTopUpModal();
          } else {
            this.showMyOrdersModal();
          }
          return this.apiService.toast.create({
            message: 'Out of Stock',
            duration: 2000,
            position: 'middle'
          }).then((r) => r.present());

        }



      console.log('ID', x);
      console.log(`getTotalSale`, this.getTotalSale.q, this.getTotalSale.t);

      // this.apiService.showLoading('', 500);

      const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
      y.stock.qtty = 1;
      console.log('y', y);
      this.orders.unshift(y);
      console.log(`orders`, this.orders);

      //  console.log('sum',this.getSummarizeOrder());
      this.getSummarizeOrder();
      // setTimeout(() => {
      // this.apiService.dismissLoading();
      this.showMyOrdersModal();
    } catch (error) {
      console.log('error', error);
      alert(JSON.stringify(error));
    }
  }


  showMyOrdersModal() {
    try {
      if (this.otherModalAreOpening == true) return;
      if (this.orders != undefined && Object.entries(this.orders).length == 0) return;
      clearInterval(this.autoShowMyOrderTimer);
      this.autoShowMyOrdersCounter = 15;

      // const component = OrderCartPage;
      const props_data = {
        orders: this.orders,
        getTotalSale: this.getTotalSale,
        currentBalance: this.currentBalance
      };
      const currentValue = this.currentBalance.value || 0;

      console.log('props_data', props_data);
      const that = this;
      this.apiService.modalCtrl.create({ component: AutoPaymentPage, componentProps: props_data, cssClass: 'dialog-fullscreen' }).then(r => {
        r.present();
        console.log('props_data', r);

        this.otherModalAreOpening = true;
        // this.apiService.allModals.push(this.apiService.modal);
        r.onDidDismiss().then(async cb => {
          this.otherModalAreOpening = false;
          this.processedQRPaid = false;
          AutoPaymentPage.message?.close();
          AutoPaymentPage.message = undefined;
          if (this.orders != undefined && Object.entries(this.orders).length > 0 && this.checkAppUpdate == false) {
            // this.loadAutoShowMyOrders();
          }
          // await this._processLoopCheckLaoQRPaid();

          if (currentValue != this.currentBalance.value) {
            this.updateBalance(this.currentBalance.value - currentValue);
          }

        });
        //5s


      });
    } catch (error) {

    }

  }


  showMyOrdersTopUpModal() {
    try {
      if (this.otherModalAreOpening == true) return;
      if (this.orders != undefined && Object.entries(this.orders).length == 0) return;
      clearInterval(this.autoShowMyOrderTimer);
      this.autoShowMyOrdersCounter = 15;

      // const component = OrderCartPage;

      const props_data = {
        orders: this.orders,
        getTotalSale: this.getTotalSale,
        currentBalance: this.currentBalance,
      }
      const currentValue = this.currentBalance.value || 0;
      console.log('props_data', props_data);
      const that = this;
      this.apiService.modalCtrl.create({ component: AutoPaymentTopUpPage, componentProps: props_data, cssClass: 'dialog-fullscreenQR' }).then(r => {
        r.present();
        this.otherModalAreOpening = true;
        // this.apiService.allModals.push(this.apiService.modal);
        r.onDidDismiss().then(async cb => {
          this.otherModalAreOpening = false;
          this.processedQRPaid = false;
          AutoPaymentTopUpPage.message?.close();
          AutoPaymentTopUpPage.message = undefined;
          if (this.orders != undefined && Object.entries(this.orders).length > 0 && this.checkAppUpdate == false) {
            // this.loadAutoShowMyOrders();
          }
          // await this._processLoopCheckLaoQRPaid();

          console.log('-----> CLOSE AUTO TOPUP');
          if (currentValue != this.currentBalance.value) {
            this.updateBalance(this.currentBalance.value - currentValue);
          }

        });
        //5s


      });
    } catch (error) {

    }

  }


  checkCartCount(position: number) {
    return this.orders.find((v) => v.position == position)?.stock?.qtty || 0;
  }
  getSummarizeOrder() {
    // this.summarizeOrder=new Array<IVendingMachineSale>();
    const o = new Array<IVendingMachineSale>();
    const ord = JSON.parse(
      JSON.stringify(this.orders)
    ) as Array<IVendingMachineSale>;
    ord.forEach((v) => {
      const x = o.find((x) => x.stock.id == v.stock.id);
      if (!x) o.push(v);
      else x.stock.qtty += 1;
    });
    console.log('OOOO', o);

    // this.summarizeOrder.push(...o);
    const t = this.getTotal();
    Object.keys(this.getTotalSale).forEach((k) => {
      this.getTotalSale[k] = t[k];
    });
    console.log(`-->`, this.getTotalSale);
    this.localSave();

    // return this.summarizeOrder;
  }
  getTotal() {
    const o = this.orders;
    console.log(`get total der`, o);
    const q = o.reduce((a, b) => {
      return a + b.stock.qtty;
    }, 0);
    const t = o.reduce((a, b) => {
      // console.log(`a`, a, `b`, b.stock.qtty, b.stock.price, b.stock.qtty * b.stock.price);
      return a + b.stock.qtty * b.stock.price;
    }, 0);
    return { q, t };
  }
  // clearOrder() {
  //   this.orders.length = 0;
  //   this.getSummarizeOrder();
  // }

  getSaleList() {
    const x = new Array<Array<IVendingMachineSale>>();

    this.vendingOnSale.forEach((v, i) => {
      if (i == this.smode) {
        x.push(this.vendingOnSale.slice(0, i));
      } else if (!(i % this.smode)) {
        x.push(this.vendingOnSale.slice(i - this.smode, i));
      } else if (i == this.vendingOnSale.length - 1) {
        x.push(
          this.vendingOnSale.slice(this.vendingOnSale.length - this.smode)
        );
      }
    });
    // console.log('x',x);

    return x;
  }
  handleRefresh(ev: any) {
    this.refresh();
  }
  // showCart() {
  //   this.apiService.showModal(ShowcartPage, { orders: this.orders, compensation: this.compensation }).then(r => {
  //     r.present();
  //   })
  // }
  getPassword() {
    let x = '';
    this.apiService.machineuuid.split('').forEach((v: any) => {
      !Number.isNaN(Number.parseInt(v)) ? (x += v) : '';
    });
    return x;
  }

  clearCart() {
    this.orders = [];
    this.getTotalSale.q = 0;
    this.getTotalSale.t = 0;
    this.localClear();
  }
  removeCart(i: number) {
    const x = this.orders.splice(i, 1);
    this.getSummarizeOrder();
    // const y = this.orders.findIndex(v => x[0]?.position == v.position);
    // if (y != -1) {
    //   this.orders.splice(y, 1);
    //   this.getSummarizeOrder();
    // }
  }


  cashin(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        // const machineId: string = localStorage.getItem('machineId');
        let params: any = {};
        let run: any = await this.cashValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.acceptcash = run.data[0].acceptcash;
        const cashList = await this.cashList();

        params = {
          cash: cashList,
          description: 'VENDING CASH IN',
        };
        run = await this.cashinValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.apiService.cash.value = Number(this.apiService.cash.value) + Number(cashList);

        resolve(IENMessage.success);
      } catch (error: any) {
        await this.apiService.soundSystemError();
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  cashList(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        let message: any = {} as any;
        let inputs: Array<any> = [
          {
            type: 'radio',
            label: '1,000',
            handler: async () => {
              await message.dismiss();
              resolve(1000);
            },
          },
          {
            type: 'radio',
            label: '5,000',
            handler: async () => {
              await message.dismiss();
              resolve(5000);
            },
          },
          {
            type: 'radio',
            label: '10,000',
            handler: async () => {
              await message.dismiss();
              resolve(10000);
            },
          },
          {
            type: 'radio',
            label: '20,000',
            handler: async () => {
              await message.dismiss();
              resolve(20000);
            },
          },
          {
            type: 'radio',
            label: '50,000',
            handler: async () => {
              await message.dismiss();
              resolve(50000);
            },
          },
          {
            type: 'radio',
            label: '100,000',
            handler: async () => {
              await message.dismiss();
              resolve(100000);
            },
          },
        ];
        // if (this.acceptcash == 100000) {
        //   inputs.splice(inputs.length - 0, 0);
        // } else if (this.acceptcash == 50000) {
        //   inputs.splice(inputs.length - 1, 1);
        // } else if (this.acceptcash == 20000) {
        //   inputs.splice(inputs.length - 2, 2);
        // } else if (this.acceptcash == 10000) {
        //   inputs.splice(inputs.length - 3, 3);
        // } else if (this.acceptcash == 5000) {
        //   inputs.splice(inputs.length - 4, 4);
        // } else {
        //   inputs = [];
        // }

        message = await this.apiService.alert.create({
          header: 'Cash In',
          inputs: inputs,
        });
        message.present();
      } catch (error: any) {
        resolve(error.message);
      }
    });
  }
  laabGo(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.summarizeOrder = JSON.parse(JSON.stringify(this.orders));

        this.summarizeOrder.forEach((item) => (item.stock.image = ''));

        console.log(`summarizeOrder`, this.summarizeOrder);
        let sum_quantity: number = 0;
        let sum_total: number = 0;
        for (let i = 0; i < this.summarizeOrder.length; i++) {
          sum_quantity += this.summarizeOrder[i].stock.qtty;
          sum_total +=
            this.summarizeOrder[i].stock.qtty *
            this.summarizeOrder[i].stock.price;
        }
        console.log(`sum total`, sum_total);
        if (this.apiService.cash.value < sum_total) {
          await this.apiService.soundPleaseTopUpValue();
          throw new Error(IENMessage.notEnoughtCashBalance);
        }
        const sum_refund = this.apiService.cash.value - sum_total;

        const paidLAAB = {
          command: EClientCommand.paidLAAB,
          data: {
            ids: this.summarizeOrder,
            value: sum_total,
            clientId: this.apiService.clientId.clientId,
          },
          ip: '',
          time: new Date().toString(),
          token: cryptojs
            .SHA256(
              this.apiService.machineId.machineId +
              this.apiService.machineId.otp
            )
            .toString(cryptojs.enc.Hex),
        };

        const props = {
          machineId: localStorage.getItem('machineId'),
          cash: this.apiService.cash.value,
          quantity: sum_quantity,
          total: sum_total,
          balance: sum_refund,
          paidLAAB: paidLAAB,
        };
        console.log(`props`, props);

        this.apiService.modalCtrl
          .create({ component: LaabGoPage, componentProps: props })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.checkActiveModal(r);
            this.openAnotherModal(r);

          });
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  clearStockAfterLAABGo() {
    this.orders = [];
    this.getTotalSale.q = 0;
    this.getTotalSale.t = 0;
    this.localClear();
  }
  epinCashOut(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.apiService.modalCtrl
          .create({ component: EpinCashOutPage, componentProps: {} })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.checkActiveModal(r);
            this.openAnotherModal(r);

          });
      } catch (error: any) {
        resolve(error.message);
      }
    });
  }
  laabCashin(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const disable =
          this.apiService.controlMenuService.disableControlMenuFunction(
            'menu-laab-cashin'
          );
        if (disable == undefined || disable == false)
          return resolve(IENMessage.success);

        // const machineId: string = localStorage.getItem('machineId');
        let params: any = {};
        let run: any = await this.cashValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.acceptcash = run.data[0].acceptcash;
        const cashList = await this.cashList();

        params = {
          cash: cashList,
          description: 'VENDING CASH IN',
        };
        console.log(`params`, params);

        let qrModel = {
          type: 'CQR',
          mode: 'COIN',
          destination: this.apiService.laabuuid,
          amount: cashList,
          expire: '',
          options: {
            coinname: this.apiService.coinName,
            name: this.apiService.name,
          },
        };

        QRCode.toDataURL(JSON.stringify(qrModel)).then(async (r) => {
          const props = {
            qrImage: r,
          };
          this.apiService.modalCtrl
            .create({
              component: LaabCashinShowCodePage,
              componentProps: props,
            })
            .then((r) => {
              r.present();
              this.otherModalAreOpening = true;
              this.openAnotherModal(r);

              clearInterval(this.autoShowMyOrderTimer);

              this.checkActiveModal(r);
              resolve(IENMessage.success);

            });
        });
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  checkActiveModal(rx: HTMLIonModalElement | undefined) {
    const t = setInterval(() => {
      this.autopilot.auto = 0;
    }, 1000);
    rx?.onDidDismiss().then(rx => {
      clearInterval(t);
      this.reloadAutoPayment();
      // this.loadAutoShowMyOrders();
    });
  }
  laabCashout(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash.value == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        const props = {};
        this.apiService.modalCtrl
          .create({ component: LaabCashoutPage, componentProps: props })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.openAnotherModal(r);
            clearInterval(this.autoShowMyOrderTimer);
            resolve(IENMessage.success);

            this.checkActiveModal(r);
          });
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        this.apiService.soundPleaseTopUpValue();
        resolve(error.message);
      }
    });
  }


  showBills() {
    console.log(`here`);
    this.apiService.loadDeliveryingBillsNew().then((r) => {
      // console.log(`response showBills`, r);
      try {
        if (r.length > 0) {
          // this.apiService.dismissModal();
          this.apiService.pb = r as Array<IBillProcess>;
          if (this.apiService.pb.length) {
            this.apiService.isDropStock = true;
            if (!this.apiService.isRemainingBillsModalOpen) {
              if (this.serial) {
                if (localStorage.getItem('device') != 'ZDM8') {
                  const lastClick = this.apiService.checkOverLastSerialAction();
                  if (lastClick) {
                    this.apiService.exitApp();
                    return;
                  }
                }
                this.apiService
                  .showModal(RemainingbillsPage, { r: this.apiService.pb, serial: this.serial }, false)
                  .then((r: any) => {
                    this.apiService.isRemainingBillsModalOpen = true;
                    this.apiService.IndexedLogDB.addBillProcess({ errorData: `RemainingbillsPage Open In Tab1` })
                    r.present();
                    r.onDidDismiss().then(() => {
                      this.apiService.IndexedLogDB.addBillProcess({ errorData: `RemainingbillsPage Close In Tab1` })
                      this.apiService.isRemainingBillsModalOpen = false;
                    })
                    this.otherModalAreOpening = true;
                    this.openAnotherModal(r);
                    clearInterval(this.autoShowMyOrderTimer);
                    this.checkActiveModal(r);
                  });
              } else {
                // Toast.show({
                //   text: 'ກະລຸນາລໍຖ້າອີກ 30 ວິນາທີ ແລ້ວກົດເຄື່ອງຕົກອີກຄັ້ງ',
                //   duration: 'long',
                // })
                this.apiService.exitApp();
              }
            }
          }

        } else {
          this.apiService.isDropStock = false;
          this.apiService.toast
            .create({ message: '', duration: 5000 })
            .then((r) => {
              r.present();
            });
        }
      } catch (error: any) {
        console.log(`error`, error);
        this.apiService.toast.create({ message: error.message, duration: 5000 }).then(r => { r.present(); });

      }

    }).catch((e) => {
      console.log(`error`, e);
      Toast.show({ text: 'Error showBills ' + JSON.stringify(e), duration: 'long' });
    })
  }
  async showBills2() {
    console.log(`here`);
    try {

      if (this.processedQRPaid) return;
      this.processedQRPaid = true;

      // await this._processLoopCheckLaoQRPaid();
      // this.apiService.IndexedDB.getBillProcesses().then((r) => {
      //   if (r.length > 0) {
      //     console.log('dropStock', r);
      //     this.apiService.isDropStock = true;
      //     Toast.show({ text: 'Please dropStock', duration: 'long' });
      //   } else {
      //     console.log('out dropStock', r);
      //     this.apiService.isDropStock = false;
      //     Toast.show({ text: 'No dropStock', duration: 'long' });
      //   }
      // }).catch((e) => {
      //   console.log('Error get dropStock from local', e);
      //   this.apiService.isDropStock = false;
      //   this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error get dropStock from local :${JSON.stringify(e)}` });
      //   Toast.show({ text: 'Error get dropStock from local ' + JSON.stringify(e), duration: 'long' });
      // });
    } catch (error) {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error _processLoopCheckLaoQRPaid :${JSON.stringify(error)}` });
      Toast.show({ text: 'Error _processLoopCheckLaoQRPaid ' + JSON.stringify(error), duration: 'long' });
    } finally {
      await new Promise((resolve, reject) => { setTimeout(() => resolve(true), 2000) });
      this.processedQRPaid = false;
    }
  }

  public openStackCashOutPage(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash.value == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        // ##here
        this.apiService.modalCtrl
          .create({ component: StackCashoutPage })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.openAnotherModal(r);

            clearInterval(this.autoShowMyOrderTimer);
            this.checkActiveModal(r);

          });

        resolve(IENMessage.success);
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  public ShowMMoneyAppLink() {
    // this.refreshControlMenuList();

    const ios_link: string =
      'https://apps.apple.com/la/app/m-money/id1513863808';
    const android_link: string =
      'https://play.google.com/store/apps/details?id=com.ltc.wallet';
    const props = {
      links: [android_link, ios_link],
    };

    this.apiService.modalCtrl
      .create({
        component: MmoneyIosAndroidDownloadPage,
        componentProps: props,
      })
      .then((r) => {
        r.present();
        this.otherModalAreOpening = true;
        this.openAnotherModal(r);
        this.checkActiveModal(r);

      });
  }

  dynamicControlMenu() {
    this.refreshControlMenuList();
    let i = setInterval(() => {
      if (this.links == undefined) {
        this.links = document.querySelectorAll(
          '.control-menu'
        ) as NodeListOf<HTMLLinkElement>;
        ControlMenuService.tab1PageLinks = this.links;
      }

      this.links = ControlMenuService.tab1PageLinks;
      this.animateControlMenu(this.links);

      this.apiService.controlMenuService.CONTROL_MENU.subscribe((r) => {
        if (r && this.links) this.animateControlMenu(this.links, r);
      });
      clearInterval(i);
    });
  }
  animateControlMenu(links: NodeListOf<HTMLLinkElement>, res?: any) {
    links.forEach((item) => {
      const name = item.className.split(' ')[2];
      if (res) {
        res.forEach((menu: any) => {
          if (name == menu.name) {
            if (menu.status == true) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          }
        });
      } else {
        this.CONTROL_MENUList.forEach((menu) => {
          if (name == menu.name) {
            if (menu.status == true) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          }
        });
      }
    });
  }
  refreshControlMenuList() {
    this.CONTROL_MENUList = JSON.parse(
      JSON.stringify(this.apiService.controlMenuService.CONTROL_MENUList)
    );
  }

  public openTopupAndServicePage(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.apiService.modalCtrl
          .create({
            component: TopupAndServicePage,
            cssClass: 'dialog-fullscreen',
          })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.openAnotherModal(r);
            clearInterval(this.autoShowMyOrderTimer);
            this.checkActiveModal(r);
          });

        resolve(IENMessage.success);
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  public openGameServices(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.apiService.modalCtrl
          .create({
            component: PlayGamesPage,
            cssClass: 'dialog-fullscreen',
          })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.openAnotherModal(r);
            clearInterval(this.autoShowMyOrderTimer);
            this.checkActiveModal(r);
          });

        resolve(IENMessage.success);
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }


  public testDrop1(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const xp = prompt('password1');
        console.log('xp', xp);
        const param = { slot: Number(xp), dropSensor: 1 };

        this.serial?.command(EMACHINE_COMMAND.shippingcontrol, param, 1).then(async (r) => {
          console.log('shippingcontrol', r);
          Toast.show({ text: 'shippingcontrol' + JSON.stringify(r) })
          try {
            this.apiService.IndexedLogDB.addBillProcess({ errorData: `Click Solot ${Number(xp)} droped` });
          } catch (err) {
            Toast.show({ text: 'Faild save drop', duration: 'long' })
          }
        }).catch((e) => {
          console.log('shippingcontrol error', e);
          Toast.show({ text: 'shippingcontrol error' + JSON.stringify(e) })
        })
        // this.apiService.modal
        //   .create({
        //     component: PlayGamesPage,
        //     cssClass: 'dialog-fullscreen',
        //   })
        //   .then((r) => {
        //     r.present();
        //     this.otherModalAreOpening = true;
        //     this.openAnotherModal(r);
        //     clearInterval(this.autoShowMyOrderTimer);
        //     this.checkActiveModal(r);
        //   });

        // resolve(IENMessage.success);
      } catch (error: any) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }



  vendingGO() {
    const props = {
      summarizeOrder: this.summarizeOrder,
      getTotalSale: this.getTotalSale,
      bills: this.bills,
      machineId: this.machineId,
      orders: this.orders,
    };
    this.apiService.modalCtrl
      .create({ component: VendingGoPage, componentProps: props })
      .then((r) => {
        r.present();
        this.otherModalAreOpening = true;
        r.onDidDismiss().then(r => {
          this.otherModalAreOpening = false;
          this.orders.length = 0;
        });
        clearInterval(this.autoShowMyOrderTimer);
        this.checkActiveModal(r);

      });
  }
  openHowToPage() {
    this.apiService.modalCtrl
      .create({
        component: HowToPage,
        componentProps: {},
        cssClass: 'dialog-fullscreen',
      })
      .then((r) => {
        r.present();
        this.otherModalAreOpening = true;
        this.openAnotherModal(r);
        clearInterval(this.autoShowMyOrderTimer);
        this.checkActiveModal(r);

      });
  }

  openSmartCB() {
    this.router.navigate(['/smartcb'])
  }


  openHMStoreVending() {
    this.router.navigate(['/HM-store-vending'])
  }

  openTestFuture() {

    this.apiService.showModal(RemainingbillsPage).then(r => {
      r?.present();
    });
  }

  async openTestMotor() {
    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 7;
        console.log('re count');
        if (this.t) {
          // clearTimeout(this.t);
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 7;
      // const x = prompt('password');
      // console.log(x, this.getPassword());

      // if (!this.getPassword().endsWith(x.substring(6)) || !x.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;

      const xp = prompt('password1');
      console.log('xp', xp);

      if (xp + '' == '1234567890_laoapps.*..') {
        console.log('xp', xp);
        await this.serial?.close();
        // this.apiService.modal.create({
        //   component: TestmotorPage,
        //   componentProps: { serial: this.serial }
        // }).then(r => {
        //   r.present();
        //   r.onDidDismiss().then(r => {
        //     this.serial?.close();
        //   })
        // })

        // if (this.t) {
        //   clearTimeout(this.t);
        //   this.t = null;
        // }
        localStorage.setItem('startTestMotor', 'true');
        this.apiService.reloadPage();
      } else {
        this.apiService.alertError('ສຳເຫຼັດແລ້ວ');
      }

    }
    // else {
    //   if (!this.t) {
    //     this.t = setTimeout(() => {`
    //       this.count = 6;
    //       console.log('re count');
    //       if (this.t) {
    //         clearTimeout(this.t);
    //         this.t = null;
    //       }
    //     }, 1500);
    //   }
    // }







  }

  async startTestMotor() {
    await this.serial?.close();
    this.apiService.modalCtrl.create({
      component: TestmotorPage,
      componentProps: { serial: this.serial }
    }).then(r => {
      r.present();
      r.onDidDismiss().then(async r => {
        await this.serial?.close();
        localStorage.setItem('startTestMotor', '');
        this.apiService.toast.create({ message: 'ອອກຈາກໂหมดທົດສອບແລ້ວ', duration: 3000 }).then(toast => {
          toast.present();
        });
        this.apiService.reloadPage();
      })
    })

    if (this.t) {
      clearTimeout(this.t);
      this.t = null;
    }
  }
  // openads() {
  //   this.apiService.modal
  //     .create({
  //       component: AdsPage,
  //       componentProps: {},
  //       cssClass: 'dialog-fullscreen',
  //     })
  //     .then((r) => {
  //       r.present();
  //       this.otherModalAreOpening = true;
  //       this.openAnotherModal(r);

  //       // this.checkActiveModal(r);

  //     });
  // }

  openWebViewMenu(link: string) {
    let component: any = {} as any;
    if (link == IWebviewTabs.hangmistore) {
      component = HangmiStoreSegmentPage;
    } else if (link == IWebviewTabs.hangmifood) {
      component = HangmiFoodSegmentPage;
    } else if (link == IWebviewTabs.topupandservices) {
      component = TopupAndServiceSegmentPage;
    }

    const props = {

    }
    this.apiService.modalCtrl
      .create({
        component: component,
        componentProps: props,
        cssClass: 'dialog-fullscreen',
      })
      .then((r) => {
        r.present();
        this.otherModalAreOpening = true;
        clearInterval(this.autoShowMyOrderTimer);
        this.checkActiveModal(r);

        this.openAnotherModal(r);
      });
  }

  openAnotherModal(r: any) {
    r.onDidDismiss().then(() => {
      this.otherModalAreOpening = false;
    });
  }

  updateNewVersion() {
    // CapacitorUpdater.download({
    //   // url: 'http://192.168.88.4:8989/test/public/dist.zip',
    //   url: `${environment.filemanagerurl}/download/`,
    //   version: '1.0.0'
    // }).then(run_download => {
    //   CapacitorUpdater.set(run_download).then(async run_update => {
    //     await this.runtoast(`update: success`);
    //   }).catch(async error => {
    //     await this.runtoast(`update: ` + error.message);
    //   });
    // }).catch(async error => {
    //   await this.runtoast(`download: ` + error.message);
    // });
  }

  // autoCheckAppVersion() {
  //   this.apiService.checkAppVersion.subscribe(run => {
  //     if (!run) return;

  //     const response: any = run;

  //     console.log(`checkAppUpdate`, this.checkAppUpdate);
  //     if (this.checkAppUpdate == true) return;

  //     this.apiService.closeAllModal();
  //     this.checkAppUpdate = true;

  //     let counter: number = 0
  //     this.autoDismissCheckAppUpdate = setInterval(() => {
  //       counter++;
  //       console.log(`counter`, counter);
  //       if (counter == 100000) {
  //         clearInterval(this.autoDismissCheckAppUpdate);
  //         counter=0;
  //         this.checkAppUpdate = false;
  //       }
  //     }, 1000);

  //     CapacitorUpdater.download({
  //       // url: 'http://192.168.88.4:8989/test/public/dist.zip',
  //       url: `${environment.filemanagerurl}download/${response.url}`,
  //       version: response.versionText
  //     }).then(async run_download => {
  //       await this.runtoast(`check sum: ` + run_download.checksum);
  //       CapacitorUpdater.set(run_download).then(async run_update => {
  //         console.log(`run_update`, run_update);
  //         if (run_update == undefined) throw new Error(IENMessage.repairFail + run_update +'');

  //         this.loadingPercent = 0;
  //         this.loadingCheck = setInterval(() => {
  //           this.loadingPercent++;
  //           if (this.loadingPercent == 100) {

  //             // repaire clear
  //             clearInterval(this.loadingCheck);
  //             this.apiService.alertSuccess(IENMessage.repairSystemComplete);
  //             localStorage.setItem('app_version', JSON.stringify(response));
  //             clearInterval(this.autoDismissCheckAppUpdate);
  //             this.checkAppUpdate = false;
  //             counter = 0;
  //             this.loadingPercent = 0;

  //             this.loadAutoShowMyOrders();
  //           }
  //         }, 100);

  //       }).catch(async error => {
  //         await this.runtoast(`update: ` + error.message);

  //         clearInterval(this.autoDismissCheckAppUpdate);
  //         this.checkAppUpdate = false;
  //         counter = 0;
  //         console.log(`update: `+ error.message);

  //         this.loadAutoShowMyOrders();

  //       });
  //     }).catch(async error => {
  //       await this.runtoast(`download: ` + error.message);

  //       clearInterval(this.autoDismissCheckAppUpdate);
  //       this.checkAppUpdate = false;
  //       counter = 0;
  //       console.log(`download: `+ error.message);

  //       this.loadAutoShowMyOrders();

  //     });

  //     console.log(`CHECK APP VERSION`, run);
  //   });
  // }

  repairText: string = '';
  displayRepaireAppVersion: boolean = false;
  checkAppVersion: boolean = false;

  loopPercent: any = {} as any;
  percentCount: number = 0;
  percentCountText: string = '0';
  percentLimit: number = 100;

  installingPecent: any = {} as any;
  installingCount: number = 15;

  APPVERSION(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        // return resolve(IENMessage.success);
        if (!this.platform.is('capacitor')) return resolve(IENMessage.success);

        this.apiService.checkAppVersion.subscribe(async run => {
          if (!run) return resolve(IENMessage.success);
          if (this.checkAppVersion == true) return resolve(IENMessage.success);
          this.otherModalAreOpening = true;

          const response: any = run;
          this.displayRepaireAppVersion = true;
          this.checkAppVersion = true;
          this.apiService.closeAllModal();

          this.repairText = IENMessage.downloadingVendingVersion + ' ' + response.versionText;

          const downloadModel = {
            url: `${environment.filemanagerurl}download/${response.url}`,
            version: response.versionText
          }
          // await this.runtoast(downloadModel.url, 60 * 10);

          // downloading
          this.loopPercent = setInterval(async () => {
            this.percentCount++;

            if (this.percentCount < this.percentLimit) {
              this.percentCountText = this.percentCount + '';
            } else {
              this.percentCountText = '100';
            }

            if (this.percentCount >= this.percentLimit) {
              this.repairText = IENMessage.extractingFile;
            }
            if (this.percentCount >= 120) {
              this.repairText = IENMessage.extractingFilePack2;
            }
            if (this.percentCount >= 240) {
              this.repairText = IENMessage.extractingFilePack3;
            }

            // if download more than 10 minute system is download fail
            if (this.percentCount >= 600) {
              this.loopPercent = 600;
              clearInterval(this.loopPercent);
              this.otherModalAreOpening = false;
              this.displayRepaireAppVersion = false;
            }

          }, 1000);


          // const download = await CapacitorUpdater.download(downloadModel);
          // if (download.status == IENMessage.pending) {

          //   // download complete

          //   this.percentCount = 100;
          //   this.percentCountText = '100';
          //   clearInterval(this.loopPercent);

          //   this.installingPecent = setInterval(async () => {
          //     this.installingCount--;
          //     this.repairText = IENMessage.installVendingVersion + ' ' + response.versionText + ' in' + this.installingCount;

          //     if (this.installingCount == 0) {
          //       clearInterval(this.installingPecent);
          //       localStorage.setItem('app_version', JSON.stringify(response));
          //       this.otherModalAreOpening = false;
          //       this.displayRepaireAppVersion = false;

          //       const install = await CapacitorUpdater.set(download);
          //       if (install == undefined) throw new Error(IENMessage.installingNewVersionFail);
          //       CapacitorUpdater.removeAllListeners();
          //       window.location.reload();
          //       resolve(IENMessage.success);
          //     }

          //   }, 1000);
          // }


        }, error => {
          this.otherModalAreOpening = false;
          this.displayRepaireAppVersion = false;
          this.apiService.alertError(error.message);
          clearInterval(this.loopPercent);
          resolve(error.message);
        });

      } catch (error: any) {
        this.otherModalAreOpening = false;
        this.displayRepaireAppVersion = false;
        this.apiService.alertError(error.message);
        clearInterval(this.loopPercent);
        resolve(error.message);
      }
    });
  }
  refreshBalanceFromAnotherModal(balance: number) {
    this.apiService.cash.value = balance;
  }

  // resetCashing(): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     try {
  //       const ownerUuid = localStorage.getItem('machineId');
  //       if (ownerUuid) {
  //         await this.cashingService.remove(ownerUuid);
  //         // window.location.reload();
  //         this.refresh();

  //       }

  //       resolve(IENMessage.success);
  //     } catch (error: any) {
  //       this.apiService.alertError(error.message);
  //       resolve(error.message);
  //     }
  //   });
  // }
  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  async showSetting() {

    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 6;
        console.log('re count');
        if (this.t) {
          // clearTimeout(this.t);
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 6;
      const x = (await this.promptPassword()) || '';
      console.log(x, this.getPassword());

      if (!this.getPassword().endsWith(x?.substring(6)) || !x?.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;
      this.apiService.showModal(SettingPage).then(r => {
        r?.present();
      })

      if (this.t) {
        clearTimeout(this.t);
        this.t = null;
      }
    }
    // else {
    //   if (!this.t) {
    //     this.t = setTimeout(() => {
    //       this.count = 6;
    //       console.log('re count');
    //       if (this.t) {
    //         clearTimeout(this.t);
    //         this.t = null;
    //       }
    //     }, 1500);
    //   }
    // }
  }


  async showQrConfig() {

    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 6;
        console.log('re count');
        if (this.t) {
          // clearTimeout(this.t);
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 6;
      const x = (await this.promptPassword()) || '';
      console.log(x, this.getPassword());

      if (!this.getPassword().endsWith(x?.substring(6)) || !x?.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;
      this.apiService.showModal(QrconfigMachinePage).then(r => {
        r?.present();
      })

      if (this.t) {
        clearTimeout(this.t);
        this.t = null;
      }
    }
  }
  rows: number[] = [5, 5, 10]; // Default to 10 items per row

  get filteredSaleList(): any[] {
    return this.saleList.filter(sl => sl.stock.qtty - this.checkCartCount(sl.position) > 0);
  }

  // Calculate the starting index for each row based on filtered list
  getRowStart(rowIndex: number): number {
    return this.rows.slice(0, rowIndex).reduce((sum, count) => sum + count, 0);
  }

  // Check if the row should be scrollable (third row with 10 items)
  isScrollableRow(rowIndex: number): boolean {
    return rowIndex === 2; // Third row (index 2) is scrollable
  }

  debugRow(rowIndex: number, rowCount: number, actualCount: number): string {
    console.log(`Row ${rowIndex}: Expected ${rowCount}, Actual ${actualCount}`);
    return '';
  }




  showMenu(m: string) {
    if (m == 'games') {
      return this.findMenu(m);
    }
    if (m == 'services') {
      return this.findMenu(m);
    }
    if (m == 'howto') {
      return this.findMenu(m);
    }
  }
  findMenu(m: string): boolean {
    return localStorage.getItem('menu-' + m) == 'true' ? true : false;
  }







  /**
 * Handle all NV9 events
 */
  private handleNV9Event(nv9Event: any) {
    console.log('🎯 NV9 Event Type:', nv9Event.event);
    console.log('📦 NV9 Event Data:', nv9Event);

    switch (nv9Event.event) {

      // ============ NOTE ACCEPTANCE EVENTS ============
      case 'READ_NOTE':
        // Note is being read/validated
        const readData = JSON.parse(nv9Event.data);
        console.log(`📖 Note being read on channel ${readData.channel}`);

        // Update UI to show note detection
        this.showToast(`Reading note on channel ${readData.channel}`, 'primary');

        // You might want to show a loading indicator
        this.isReadingNote = true;
        this.currentReadingChannel = readData.channel;
        break;

      case 'CREDIT_NOTE':
        // Note accepted - CREDIT ISSUED!
        const creditData = JSON.parse(nv9Event.data);
        console.log(`💰 CREDIT ISSUED on channel ${creditData.channel}`);

        // Map channel to actual money value
        const channelValues: { [key: number]: number } = {
          0: 500,
          1: 1000,   // 1000 LAK
          2: 2000,   // 2000 LAK
          3: 5000,   // 5000 LAK
          4: 10000,  // 10000 LAK
          5: 20000,  // 20000 LAK
          6: 50000,  // 50000 LAK
          7: 100000, // 100000 LAK
          8: 200000  // 200000 LAK (if available)
        };

        const amount = channelValues[creditData.channel] || 0;

        // Show success message
        this.showToast(`💰 +${amount} LAK credited!`, 'success');

        // Update your app's balance
        this.updateBalance(amount);

        // Track transaction
        this.addTransaction({
          type: 'CASH_IN',
          amount: amount,
          channel: creditData.channel,
          timestamp: new Date()
        });

        // Reset reading flag
        this.isReadingNote = false;
        break;

      case 'NOTE_STACKED':
        // Note moved to cashbox
        console.log('📦 Note stacked in cashbox');
        this.showToast('Note stored in cashbox', 'secondary');
        break;

      // ============ REJECTION EVENTS ============
      case 'NOTE_REJECTING':
        console.log('⚠️ Note is being rejected');
        this.showToast('Note rejected - please remove', 'warning');
        break;

      case 'NOTE_REJECTED':
        const rejectData = JSON.parse(nv9Event.data);
        console.log('❌ Note rejected:', rejectData);

        // Map reject codes to messages
        const rejectMessages: { [key: number]: string } = {
          0x01: 'Note length incorrect',
          0x06: 'Channel inhibited',
          0x07: 'Second note inserted',
          0x0B: 'Note too long',
          0x0D: 'Mechanism slow/stalled',
          0x0F: 'Fraud channel reject',
          0x11: 'Peak detect fail',
          0x12: 'Twisted note detected',
          0x13: 'Escrow timeout',
          0x14: 'Bar code scan fail'
        };

        const rejectMessage = rejectMessages[rejectData.code] || 'Unknown reject reason';
        this.showToast(`❌ Note rejected: ${rejectMessage}`, 'danger');

        this.isReadingNote = false;
        break;

      // ============ STATUS EVENTS ============
      case 'ENABLED':
        console.log('🟢 NV9 Enabled');
        this.isNV9Enabled = true;
        this.showToast('Cash acceptor ready', 'success');
        break;

      case 'DISABLED':
        console.log('🔴 NV9 Disabled');
        this.isNV9Enabled = false;
        // this.showToast('Cash acceptor disabled', 'warning');
        break;

      case 'STACKER_FULL':
        console.log('📊 Cashbox is full');
        this.showToast('⚠️ Cashbox full - please empty', 'danger');

        // You might want to disable cash-in when full
        // this.disableCashIn();
        break;

      // ============ CASHBOX EVENTS ============
      case 'CASHBOX_REMOVED':
        console.log('📭 Cashbox removed');
        this.isCashboxPresent = false;
        this.showToast('Cashbox removed', 'warning');

        // Automatically disable when cashbox removed
        // this.disableCashIn();
        break;

      case 'CASHBOX_REPLACED':
        console.log('📬 Cashbox replaced');
        this.isCashboxPresent = true;
        this.showToast('Cashbox replaced', 'success');

        // Re-enable if appropriate
        if (this.shouldAutoEnable) {
          // this.enableCashIn();
        }
        break;

      // ============ JAM/FRAUD EVENTS ============
      case 'FRAUD_ATTEMPT':
        console.log('🚫 Fraud attempt detected');
        this.showToast('🚫 Fraud attempt detected', 'danger');

        // Log for security
        // this.logSecurityEvent('FRAUD_ATTEMPT', nv9Event.data);
        break;

      case 'SAFE_NOTE_JAM':
        console.log('🔧 Safe note jam');
        this.showToast('Paper jam - please clear', 'danger');
        break;

      case 'UNSAFE_NOTE_JAM':
        console.log('🔧 Unsafe note jam');
        this.showToast('Critical jam - service required', 'danger');
        break;

      // ============ NOTE HANDLING EVENTS ============
      case 'NOTE_HELD_IN_BEZEL':
        const bezelData = JSON.parse(nv9Event.data);
        console.log(`🔄 Note held in bezel: ${bezelData.value} ${bezelData.country_code}`);

        // Show take note prompt
        this.showTakeNotePrompt(bezelData.value);
        break;

      case 'NOTE_CLEARED_FROM_FRONT':
        console.log('⬅️ User took note back');
        this.showToast('Note returned to user', 'secondary');
        break;

      case 'NOTE_CLEARED_TO_CASHBOX':
        console.log('➡️ Note cleared to cashbox');
        break;

      // ============ CHANNEL EVENTS ============
      case 'CHANNEL_DISABLE':
        const channelData = JSON.parse(nv9Event.data);
        console.log(`🚫 Channel ${channelData.channel} disabled`);
        break;

      // ============ NV9 READY EVENT ============
      case 'nv9Ready':
        console.log('✅ NV9 initialized and ready:', nv9Event.message);
        this.isNV9Ready = true;
        this.showToast('NV9 cash acceptor ready', 'success');

        // Get device info
        this.getNV9DeviceInfo();
        break;

      case 'nv9Error':
        console.error('❌ NV9 Error:', nv9Event.error);
        this.showToast(`NV9 Error: ${nv9Event.error}`, 'danger');

        // Try to reinitialize after error
        if (nv9Event.error.includes('timed out') || nv9Event.error.includes('communication')) {
          setTimeout(() => {
            console.log('Attempting to reinitialize NV9...');
            // this.reinitializeNV9();
          }, 5000);
        }
        break;

      case 'nv9Retrying':
        console.log(`🔄 NV9 retrying (${nv9Event.retryCount}/${nv9Event.maxRetries})`);
        this.showToast(`Connecting to NV9... (${nv9Event.retryCount}/${nv9Event.maxRetries})`, 'secondary');
        break;

      // ============ USB DEVICE EVENTS ============
      case 'usbDeviceEvent':
        this.handleUSBEvent(nv9Event.data);
        break;

      default:
        console.log('Unknown NV9 event:', nv9Event);
    }
  }

  /**
   * Handle USB device events
   */
  private handleUSBEvent(usbEvent: any) {
    console.log('🔌 USB Event:', usbEvent);

    switch (usbEvent.event) {
      case 'usbAttached':
        console.log(`USB device attached: ${usbEvent.deviceName}`);
        this.showToast('USB device detected', 'secondary');
        break;

      case 'usbDetached':
        console.log(`USB device detached: ${usbEvent.deviceName}`);
        this.isNV9Ready = false;
        this.showToast('USB device disconnected', 'warning');
        break;

      case 'usbPermissionGranted':
        console.log(`USB permission granted for ${usbEvent.deviceName}`);
        break;

      case 'usbScanComplete':
        if (usbEvent.found) {
          console.log(`Found ${usbEvent.count} USB devices`);
        } else {
          console.log('No USB devices found');
        }
        break;

      case 'usbAutoConnected':
        console.log('✅ USB NV9 auto-connected successfully');
        break;

      case 'usbAutoConnectFailed':
        console.log('❌ USB NV9 auto-connect failed:', usbEvent.reason);
        break;
    }
  }

  // ============ HELPER METHODS ============

  private showToast(message: string, color: string = 'primary') {
    // Use your preferred toast service
    Toast.show({ text: message, duration: 'long' });
    this.saveLogs(message);
    // Or if using Ionic
    // const toast = await this.toastController.create({
    //   message: message,
    //   duration: 2000,
    //   color: color
    // });
    // toast.present();
  }
  // 1. Save log (safe JSON handling)
  saveLogs(message: string) {
    try {
      let logs: Array<{ message: string; timestamp: string }> = [];
      const stored = localStorage.getItem('nv9Logs');

      if (stored) {
        logs = JSON.parse(stored);
      }

      logs.push({
        message,
        timestamp: new Date().toISOString(),
      });

      localStorage.setItem('nv9Logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to save log:', err);
      // Fallback: don't lose the message
      console.log('Lost log:', message);
    }
  }

  /**
  * Updates balance and logs the transaction to blockchain
  * @param amount Positive = cash inserted, Negative = cash removed/reset/transferred out
  */
  private async updateBalance(amount: number) {
    if (amount === 0) return;

    try {
      const isInsert = amount > 0;
      const absAmount = Math.abs(amount);

      // 1. Get previous block
      const latest = await this.blockchainDbService.getLatestBlock(this.machineId.machineId);
      const prevHash = latest?.hash || '0000000000000000000000000000000000000000000000000000000000000000';
      const nextIndex = (latest?.block_index ?? 0) + 1;

      // 2. Create transaction data
      const txData = {
        type: isInsert ? 'insert' : 'withdrawal',  // or 'reset' if it's a full clear
        amount: absAmount,                         // always positive number
        timestamp: new Date().toISOString(),
        // Optional: add note or reason
        note: isInsert ? 'Banknote accepted' : 'Cash reset / transferred to e-wallet',
      };

      // 3. Compute block hash (consistent with client)
      const blockString = JSON.stringify({
        prevHash,
        index: nextIndex,
        data: txData,
        timestamp: txData.timestamp,
      });
      const newHash = CryptoJS.SHA256(blockString).toString();

      // 4. Log to blockchain
      await this.blockchainDbService.addBlock({
        machineId: this.machineId.machineId,
        prevHash,
        hash: newHash,
        data: txData,
        isReset: !isInsert,               // flag reset/withdrawal
        signature: '',                    // add later if needed
        needsSync: true,
      });

      // 5. Update UI balance (optimistic)
      this.currentBalance.value += amount;  // + for insert, - for withdrawal


      console.log(
        `${isInsert ? 'Inserted' : 'Withdrew'} ${absAmount} → New balance: ${this.currentBalance.value}`
      );
    } catch (err) {
      console.error('Failed to update balance / log transaction:', err);
      // Optional: revert UI balance if critical
    }
  }
  // Add this method
  async loadOnlineBalance(): Promise<number> {
    try {
      const machineId = this.machineId?.machineId;
      if (!machineId) return 0;

      let localBalance = await this.blockchainDbService.getLocalBalance(machineId);

      const offlineMode = localStorage.getItem('offlineMode') === 'true';

      if (!offlineMode) {
        try {
          const res = await this.apiService.getBlockChainBalance(machineId);

          if (res?.status === 1 && res.data) {
            const serverBalance = Number(res.data.data.currentBalance ?? 0);

            if (Math.abs(serverBalance - localBalance) > 0.01) {
              console.warn(`Balance mismatch - Local: ${localBalance}, Server: ${serverBalance}`);
              localBalance = serverBalance;
            }
          }
        } catch (err) {
          console.warn('Server balance fetch failed, using local balance', err);
        }
      }

      this.currentBalance.value = localBalance;
      return localBalance;

    } catch (err) {
      console.error('Failed to load balance:', err);
      return 0;
    }
  }
  private async syncToServer(LaabXWallet: string = ''): Promise<void> {
    const offlineMode = localStorage.getItem('offlineMode') === 'true';
    if (offlineMode) {
      console.log('Offline mode - skipping server sync');
      return;
    }

    try {
      const unsynced = await this.blockchainDbService.getUnsyncedBlocks(this.machineId.machineId, 200);

      if (!unsynced.length) {
        console.log('No blocks need syncing');
        return;
      }

      console.log(`Syncing ${unsynced.length} blocks to server...`);

      const res = await this.apiService.blockChainSync(unsynced, LaabXWallet);

      if (res?.status === 1) {
        const blockIds = unsynced.map(b => b.id);
        await this.blockchainDbService.markAsSynced(blockIds);
        console.log(`Successfully synced ${blockIds.length} blocks`);

        // Continue syncing if there are more batches
        if (unsynced.length === 200) {
          setTimeout(() => this.syncToServer(LaabXWallet), 1500);
        }
      } else {
        console.warn('Server rejected sync:', res);
        throw new Error('Server returned non-success status');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      // Re-throw so topUpEwallet knows it failed
      throw err;
    }
  }
  // 2. Sync with retry & error handling
  private async syncLogsToServer() {
    console.log('Syncing logs to server...');

    let logs: Array<{ message: string; timestamp: string }> = [];
    const stored = localStorage.getItem('nv9Logs');

    if (!stored || stored === '[]') {
      console.log('No logs to sync');
      return;
    }

    try {
      logs = JSON.parse(stored);
      if (!Array.isArray(logs) || logs.length === 0) return;
    } catch (err) {
      console.error('Invalid logs in storage:', err);
      localStorage.setItem('nv9Logs', '[]'); // clear corrupt data
      return;
    }

    try {
      // Send to server (your existing API call)
      await this.apiService.blockChainSyncLog(logs);

      // Success → clear logs
      localStorage.setItem('nv9Logs', '[]');
      console.log(`Synced ${logs.length} logs successfully`);

      // Optional: show success toast
      this.showToast(`Synced ${logs.length} logs`, 'success');
    } catch (err) {
      console.error('Log sync failed:', err);

      // Do NOT clear logs on failure → retry next interval
      // Optional: limit retries or add exponential backoff
      this.showToast('Log sync failed – will retry', 'warning');
    }
  }


  private addTransaction(transaction: any) {
    // Store transaction in your database
    this.transactions.unshift(transaction);

    // Keep only last 50 transactions
    if (this.transactions.length > 50) {
      this.transactions.pop();
    }
  }

  private showTakeNotePrompt(value: number) {
    // Show a prompt asking user to take the note
    console.log(`Please take your ${value} LAK note`);

    // You might want to show a modal or alert
    // this.alertController.create({
    //   header: 'Take Your Note',
    //   message: `Please take your ${value} LAK note from the bezel`,
    //   buttons: ['OK']
    // }).then(alert => alert.present());
  }

  private async getNV9DeviceInfo() {
    try {
      // Get serial number
      const serialResult = await this.serial?.nv9Command(
        EMACHINE_COMMAND.NV9_GET_SERIAL,
        {},
        Date.now()
      );

      if (serialResult?.data?.serial_number) {
        console.log('NV9 Serial Number:', serialResult.data.serial_number);
        this.nv9SerialNumber = serialResult.data.serial_number;
      }

      // Get setup info (channel values)
      const setupResult = await this.serial?.nv9Command(
        EMACHINE_COMMAND.NV9_SETUP_REQUEST,
        {},
        Date.now()
      );

      if (setupResult?.data) {
        console.log('NV9 Setup Info:', setupResult.data);
        this.nv9ChannelValues = setupResult.data.channel_values;
      }

    } catch (error) {
      console.error('Failed to get NV9 device info:', error);
    }
  }
  public async resetCashAcceptor() {
    try {
      // Reset NV9 hardware
      const serialResult = await this.serial?.nv9Command(
        EMACHINE_COMMAND.NV9_RESET,
        {},
        Date.now()
      );

      // Log full cash removal (negative = withdraw all)
      await this.updateBalance(-this.currentBalance.value);
      await this.syncToServer(); // Ensure this critical transaction is synced immediately
      console.log('Cash acceptor reset and balance cleared');
    } catch (error) {
      console.error('Failed to reset NV9:', error);
    }
  }

  private async promptWalletId(): Promise<string | null> {
    return new Promise(async (resolve) => {
      let digits = '';
      let resolved = false;

      const done = (val: string | null) => {
        if (resolved) return;
        resolved = true;
        console.log('-----> DONE :', val);

        resolve(val);
      };

      const alert = await this.alertCtrl.create({
        cssClass: 'wallet-prompt-alert',
        header: 'Top up e-wallet',
        subHeader: 'LaabX Wallet ID',
        message: ' ',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'wallet-prompt-cancel',
            handler: () => done(null),
          },
          {
            text: 'Confirm',
            cssClass: 'wallet-prompt-confirm',
            handler: () => {
              if (digits.length !== 8) return false;
              done(digits);
            },
          },
        ],
      });

      await alert.present();

      const wrapper = document.querySelector('.wallet-prompt-alert .alert-wrapper') as HTMLElement;
      const msgEl = wrapper?.querySelector('.alert-message') as HTMLElement;
      if (!msgEl) return;

      // ใช้ inline styles ทั้งหมด เพราะ Angular scoped CSS ไม่ถึง Alert DOM
      msgEl.style.cssText = 'padding:0;font-size:inherit;overflow:visible';

      const digitRow = document.createElement('div');
      digitRow.style.cssText = `
      display:flex; gap:6px; justify-content:center;
      padding:16px 8px 20px;
    `;

      const boxes: HTMLElement[] = Array.from({ length: 8 }, (_, i) => {
        const box = document.createElement('div');
        box.dataset['i'] = String(i);
        box.style.cssText = `
        flex:1; height:44px;
        border:1.5px solid #92949c;
        border-radius:10px;
        display:flex; align-items:center; justify-content:center;
        font-size:18px; font-weight:500;
        color:#1a1a1a;
        font-family:'JetBrains Mono', monospace;
        transition:border-color 0.15s, background 0.12s;
      `;
        box.textContent = '_';
        digitRow.appendChild(box);
        return box;
      });

      const keypadEl = document.createElement('div');
      keypadEl.style.cssText = `
      display:grid; grid-template-columns:repeat(3,1fr);
      gap:8px; padding:0 4px 8px;
    `;

      [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].forEach((k) => {
        const key = document.createElement('div');
        key.style.cssText = `
        height:52px; border-radius:12px;
        display:flex; align-items:center; justify-content:center;
        font-size:20px; font-weight:500;
        cursor:pointer; user-select:none;
        -webkit-tap-highlight-color:transparent;
        transition:background 0.1s, transform 0.08s;
        ${k === ''
            ? 'background:transparent;border:none;pointer-events:none;'
            : 'background:#f4f5f8;border:0.5px solid #e0e0e0;color:#1a1a1a;'}
      `;
        if (k === 'del') {
          key.innerHTML = '⌫';
          key.style.color = '#92949c';
          key.style.fontSize = '22px';
        } else if (k !== '') {
          key.textContent = String(k);
        }
        if (k !== '') key.dataset['k'] = String(k);
        keypadEl.appendChild(key);
      });

      msgEl.appendChild(digitRow);
      msgEl.appendChild(keypadEl);

      const confirmBtn = wrapper.querySelector('.wallet-prompt-confirm') as HTMLButtonElement;
      confirmBtn.disabled = true;

      const render = () => {
        boxes.forEach((box, i) => {
          const filled = i < digits.length;
          const active = i === digits.length && digits.length < 8;
          box.textContent = filled ? digits[i] : '_';
          box.style.borderColor = active
            ? 'var(--ion-color-primary)'
            : filled ? '#3d3d3d' : '#92949c';
          box.style.background = filled ? '#f4f5f8' : 'transparent';
          box.style.boxShadow = active
            ? '0 0 0 3px rgba(var(--ion-color-primary-rgb),0.15)'
            : 'none';
        });
        confirmBtn.disabled = digits.length !== 8;
      };

      keypadEl.addEventListener('click', (e) => {
        const key = (e.target as HTMLElement).closest<HTMLElement>('[data-k]');
        if (!key) return;
        const k = key.dataset['k'];

        // tap feedback
        key.style.transform = 'scale(0.93)';
        key.style.background = '#e5e5ea';
        setTimeout(() => {
          key.style.transform = 'scale(1)';
          key.style.background = '#f4f5f8';
        }, 120);

        if (k === 'del') {
          digits = digits.slice(0, -1);
        } else if (digits.length < 8 && k) {
          digits += k;
        }
        render();
      });

      render();
    });
  }


  public async topUpEwallet() {
    try {
      const walletId = await this.promptWalletId();
      if (!walletId) {
        console.log('User cancelled wallet prompt');
        return;
      }

      const LaabXWallet = walletId;

      const currentDbBalance = await this.blockchainDbService.getLocalBalance(
        this.machineId?.machineId
      );

      if (currentDbBalance <= 0) {
        console.log('No balance to transfer');
        return;
      }

      const offlineMode = localStorage.getItem('offlineMode') === 'true';

      // 1. Always create the withdrawal block locally first (source of truth)
      const transferAmount = -currentDbBalance;
      await this.updateBalance(transferAmount);   // This now only does local DB + optimistic UI

      console.log(`Local withdrawal block created for ${currentDbBalance} LAK to wallet: ${LaabXWallet}`);

      // 2. Try to sync immediately (only if online)
      let syncSuccess = false;

      if (!offlineMode) {
        try {
          await this.syncToServer(LaabXWallet);   // Pass walletId only for this sync
          syncSuccess = true;
          console.log('Sync to server succeeded - balance transferred safely');
        } catch (syncErr) {
          console.error('Sync to server failed after local withdrawal:', syncErr);
          syncSuccess = false;
          // Do NOT reset NV9 yet - money is still physically in the machine
          // The unsynced block remains in DB and will be retried automatically
        }
      } else {
        console.log('Offline mode - withdrawal logged locally, will sync later');
        syncSuccess = true; // treat as "ok" for offline
      }

      // 3. Only reset the cash acceptor if sync succeeded (or offline)
      if (syncSuccess) {
        this.currentBalance.value = 0;
        console.log(`Successfully transferred ${currentDbBalance} LAK to e-wallet: ${LaabXWallet}`);

        // await this.serial?.nv9Command(EMACHINE_COMMAND.NV9_RESET, {}, Date.now());
        console.log('Cash acceptor reset after successful transfer');
      } else {
        // Critical: Do NOT reset if sync failed!
        console.warn('Sync failed - keeping cash in acceptor. Will retry sync later.');
        // Optional: Show user a message "Transfer queued. Please try again later or check internet."
      }

    } catch (error) {
      console.error('Failed to top up e-wallet:', error);
      // Optional: rollback the last block if it was a critical error (rare)
    }
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
  async reinitializeNV9(): Promise<boolean> {
    try {
      console.log('🔄 Sending NV9 reinit command...');

      const result = await this.serial?.nv9Command(EMACHINE_COMMAND.NV9_REINIT, {}, 1);

      if (result?.status) {
        console.log('✅ NV9 reinit successful:', result.message);
        return true;
      } else {
        console.error('❌ NV9 reinit failed:', result?.message);
        return false;
      }
    } catch (error) {
      console.error('Error sending reinit command:', error);
      return false;
    }
  }
  enableCash() {
    this.serial?.nv9Command(EMACHINE_COMMAND.NV9_ENABLE, { enable: true }, 1).then(async (r) => {
      console.log('enableCash', r);
      await Toast.show({ text: 'enableCash' + JSON.stringify(r) })
    }).catch(e => {
      console.error('enableCash error', e);
      Toast.show({ text: 'enableCash error' + JSON.stringify(e) })
    });
  }
  disableCash() {
    this.serial?.nv9Command(EMACHINE_COMMAND.NV9_DISABLE, { enable: false }, 1).then(async (r) => {
      console.log('disableCash', r);
    }).catch(e => {
      console.error('disableCash error', e);
    });
  }
  // ============ UI State Variables ============
  isNV9Ready: boolean = false;
  isNV9Enabled: boolean = false;
  isCashboxPresent: boolean = true;
  isReadingNote: boolean = false;
  currentReadingChannel: number = -1;
  currentBalance = { value: 0, currency: 'LAK' };
  nv9SerialNumber: string = '';
  nv9ChannelValues: number[] = [];
  transactions: any[] = [];
  shouldAutoEnable: boolean = true;




}
