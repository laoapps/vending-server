import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { AdsPage } from '../ads/ads.page';
import { HangmiStoreSegmentPage } from './VendingSegment/hangmi-store-segment/hangmi-store-segment.page';
import { HangmiFoodSegmentPage } from './VendingSegment/hangmi-food-segment/hangmi-food-segment.page';
import { TopupAndServiceSegmentPage } from './VendingSegment/topup-and-service-segment/topup-and-service-segment.page';
import { PlayGamesPage } from './Vending/play-games/play-games.page';
import { OrderCartPage } from './Vending/order-cart/order-cart.page';
import { ScreenBrightness } from '@capacitor-community/screen-brightness';

var host = window.location.protocol + '//' + window.location.host;
// import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { AutoPaymentPage } from './Vending/auto-payment/auto-payment.page';
import { TestmotorPage } from '../testmotor/testmotor.page';
import { VendingIndexServiceService } from '../vending-index-service.service';
import { SerialServiceService } from '../services/serialservice.service';
import { Toast } from '@capacitor/toast';
import { RemainingbilllocalPage } from '../remainingbilllocal/remainingbilllocal.page';
import { GenerateLaoQRCodeProcess } from './LaoQR_processes/generateLaoQRCode.process';
import * as moment from 'moment';
import { DatabaseService } from '../database.service';
import { IBankNote, IHashBankNote } from '../vmc.service';
import { Zdm8Service } from '../zdm8.service';
import { LiveupdateService } from '../liveupdate.service';
import { App } from '@capacitor/app';
import { VideoCacheService } from '../video-cache.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnDestroy {
  readyState = false;
  contact = localStorage.getItem('contact') || '55516321';




  serial: ISerialService;
  open = false;

  vlog = { log: { data: '', limit: 50 } as IlogSerial };


  devices = ['VMC', 'ZDM8', 'Tp77p', 'essp', 'cctalk', 'm102', 'adh815'];

  selectedDevice = localStorage.getItem('device') || '';

  portName = localStorage.getItem('portName') || '/dev/ttyS0';
  baudRate = localStorage.getItem('baudRate') || 9600;
  platforms: { label: string; value: ESerialPortType }[] = [];
  isSerial: ESerialPortType = ESerialPortType.Serial;

  adsList: any = localStorage.getItem('adsList') || [];

  connecting = false;

  // isDropStock = false;

  offlineMode: Boolean = true;


  // enableCashIn: boolean = false;

  isShowLaabTabEnabled: boolean = false;

  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;
  private cashValidationProcess: CashValidationProcess;
  private cashinValidationProcess: CashinValidationProcess;
  private loadStockListProcess: LoadStockListProcess;

  private CONTROL_MENUList: Array<{ name: string; status: boolean }> = [];
  private links: NodeListOf<HTMLLinkElement>;

  private ownerUuid: string;
  filemanagerURL: string = environment.filemanagerurl;

  acceptcash: number;
  _machineStatus = { status: {} as IMachineStatus };

  machinestatus = { data: '' };

  production = environment.production;

  hmLogo = 'assets/icon/logo.png';

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
  _howToPage: HTMLIonModalElement;
  isFirstLoad = true;
  autopilot = { auto: 0 };


  isRobotMuted = localStorage.getItem('isRobotMuted') ? true : false;
  isMusicMuted = localStorage.getItem('isMusicMuted') ? true : false;
  isAds = localStorage.getItem('isAds') ? true : false;
  musicVolume = localStorage.getItem('musicVolume') ? Number(localStorage.getItem('musicVolume')) : 6;
  versionId = localStorage.getItem('versionId') || '0.0.0';

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
      icon: "../../assets/webview/hangmistore.jpeg",
      name: 'Hangmi Store',
      description: 'Shopping online ecomerc by Hangmi Store application services',
      link: 'hangmistore'
    },
    {
      icon: "../../assets/webview/hangmifood.png",
      name: 'Hangmi Food',
      description: 'Order and delivery your food by Hangmi Food application services',
      link: 'hangmifood'
    },
    {
      icon: "../../assets/webview/topupandservices.jpeg",
      name: 'Topup & Services',
      description: 'Online payment and options',
      link: 'topupandservices'
    }
  ]
  currentSegementTab: string = ITabVendingSegement.vending;

  autoShowMyOrderTimer: any = {} as any;
  autoShowMyOrdersCounter: number = 15;

  isFranciseMode: boolean = localStorage.getItem('francisemode') ? true : false;

  checkAppUpdate: boolean = false;
  autoDismissCheckAppUpdate: any = {} as any;
  loadingCheck: any = {} as any;
  loadingPercent: number = 0;

  otherModalAreOpening: boolean = false;

  t: any;
  count = 6;


  countdownCheckLaoQRPaidTimer: any = {} as any;
  // countdownCheckLaoQRPaid: number = 90;
  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;


  processedQRPaid: any;


  private creditPending: ICreditData[] = [];

  // interval
  refreshAll: any = {} as any;
  refreshAllCounter: number = 0;
  firstCredit: boolean = true;

  queues = new Array<{ data: any, command: string }>();

  sendStatus(b: string, t: number, c: EMACHINE_COMMAND = EMACHINE_COMMAND.MACHINE_STATUS) {
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
        that.apiService.updateStatus({ data: b, transactionID: t, command: c }).subscribe(r => {
          that.queues.shift();
          console.log('QUEUES', that.queues);
          console.log('vmc service send response', r);
          // Toast.show({ text: 'Machine send response' + JSON.stringify(r), duration: 'long' });
          if (r.command === EMACHINE_COMMAND.CREDIT_NOTE) {
            if (r.transactionID) {
              const x = that.creditPending.find(v => v.transactionID === r.transactionID);
              if (x) {
                that.deleteCredit(x.id);
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
    private serialService: SerialServiceService,
    private dbService: DatabaseService,
    private videoCacheService: VideoCacheService
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

      this.ownerUuid = localStorage.getItem('machineId');
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
          this.initStock();
          if (this.isFirstLoad) {
            // let adsOn =false
            setInterval(async () => {
              if (this.autopilot.auto >= 6) {
                // load ads when no active
                // if(!adsOn)
                const adsSlide = localStorage.getItem('isAds');
                if (adsSlide != undefined && adsSlide == 'yes') {
                  if (!this.adsOn) {
                    const currentRoute = await this.apiService.modal.getTop();
                    if (!currentRoute) {
                      this.apiService.showModal(AdsPage).then(r => {
                        r.present();
                        this.otherModalAreOpening = true;
                        this.checkActiveModal(r);
                        this.openAnotherModal(r);

                        this.adsOn = true;
                        r.onDidDismiss().then(rx => {
                          this.adsOn = false;
                        })
                      })
                    }
                  } else {
                    this.adsOn = false;
                    this.apiService.dismissModal();
                    const currentRoute = await this.apiService.modal.getTop();
                    if (!currentRoute) {
                      this.apiService.showModal(AdsPage).then(r => {
                        r.present();
                        this.otherModalAreOpening = true;
                        this.checkActiveModal(r);
                        this.openAnotherModal(r);

                        this.adsOn = true;
                        r.onDidDismiss().then(rx => {
                          this.adsOn = false;
                        })
                      })
                    }

                  }
                } else {
                  if (this.adsOn) {
                    this.adsOn = false;
                    this.apiService.dismissModal();
                  }
                }


                this.apiService.soundGreeting();
                setTimeout(() => {
                  this.apiService.soundPleaseVisit();
                }, 5000);

                setTimeout(() => {

                  if (new Date().getTime() % 2) {
                    setTimeout(() => {
                      this.apiService.soundPointToCashOut();
                    }, 5000);
                    setTimeout(() => {
                      this.apiService.soundPleaseViewVideo();
                    }, 10000);
                    setTimeout(() => {
                      this.apiService.soundCheckTicketsExist();
                    }, 15000);
                    setTimeout(() => {
                      if (this.apiService.cash.amount > 0) this.apiService.soundMachineHasSomeChanges();
                    }, 20000);
                  }

                }, 10000);
                this.autopilot.auto = 0;

              } else {
                this.autopilot.auto++;
              }
              const hour = new Date().getHours();// >19 , >0&&<8

            }, 10000);

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

  ngOnInit() {

    // window.addEventListener('beforeunload', async (event) => {
    //   Toast.show({ text: 'Before reload', duration: 'long' });
    //   await this.serial.close();

    // });

    this.isShowLaabTabEnabled = JSON.parse(localStorage.getItem(this.apiService.controlMenuService.localname)).find(x => x.name == 'menu-showlaabtab').status ?? false;

    this.platforms = Object.keys(ESerialPortType)
      .filter(key => isNaN(Number(key))) // Remove numeric keys
      .map(key => ({
        label: key,  // Display name
        value: ESerialPortType[key as keyof typeof ESerialPortType] // Enum value
      }));

    setTimeout(async () => {
      await this.connect();
      this.readyState = true;
      Toast.show({ text: 'READY', duration: 'long' })
    }, 1000);

    clearInterval(this.countdownCheckLaoQRPaidTimer);
    this.countdownCheckLaoQRPaidTimer = setInterval(async () => {
      console.log('*****CHECK 30 SECOND');

      // that._processLoopCheckLaoQRPaid();

      if (this.processedQRPaid) return;
      this.processedQRPaid = true;
      await this._processLoopCheckLaoQRPaid();
      this.processedQRPaid = false;

      this.apiService.IndexedDB.getBillProcesses().then((r) => {
        if (r.length > 0) {
          console.log('dropStock', r);
          this.apiService.isDropStock = true;

        } else {
          console.log('out dropStock', r);
          this.apiService.isDropStock = false;
        }
      }).catch((e) => {
        console.log('Error get dropStock from local', e);
        this.apiService.isDropStock = false;
      });
    }, 30000);



    // this._processLoopCheckLaoQRPaid();



    this.WSAPIService.aliveSubscription.subscribe(async res => {
      console.log('ALIVE TAB1', res);
      try {
        const r = res?.data?.setting;
        if (res?.data?.settingVersion) {
          localStorage.setItem('settingVersion', res?.data?.settingVersion);
        }
        // if (r && this.readyState) {
        if (r) {

          if (r.refresh) {
            Toast.show({ text: 'Refresh ' + r.refresh, duration: 'long' });
            this.refresh();
          }

          // set allow vending
          console.log('ALLOW VENDING', r.allowVending);

          if (this.allowVending != r.allowVending) {

            this.allowVending = r.allowVending;
            console.log('Update Allow vending to', this.allowVending);

          }


          if (this.isAds != r.isAds) {
            this.isAds = r.isAds;
            // console.log('Update isAds to', this.isAds);
            localStorage.setItem('isAds', this.isAds ? 'yes' : '');

            const adsSlide = localStorage.getItem('isAds');
            if (adsSlide != undefined && adsSlide == 'yes') {
              if (!this.adsOn) {
                const currentRoute = await this.apiService.modal.getTop();
                if (!currentRoute) {
                  this.apiService.showModal(AdsPage).then(r => {
                    r.present();
                    this.otherModalAreOpening = true;
                    this.checkActiveModal(r);
                    this.openAnotherModal(r);

                    this.adsOn = true;
                    r.onDidDismiss().then(rx => {
                      this.adsOn = false;
                    })
                  })
                }
              } else {
                this.adsOn = false;
                this.apiService.dismissModal();
                const currentRoute = await this.apiService.modal.getTop();
                if (!currentRoute) {
                  this.apiService.showModal(AdsPage).then(r => {
                    r.present();
                    this.otherModalAreOpening = true;
                    this.checkActiveModal(r);
                    this.openAnotherModal(r);

                    this.adsOn = true;
                    r.onDidDismiss().then(rx => {
                      this.adsOn = false;
                    })
                  })
                }
              }
            } else {
              if (this.adsOn) {
                this.adsOn = false;
                this.apiService.dismissModal();
              }
            }


            this.apiService.soundGreeting();
          }

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
            this.apiService.reloadPage();
          }

          if (this.versionId != r.versionId) {
            this.versionId = r.versionId;
            localStorage.setItem('versionId', this.versionId);
            console.log('Update versionId to', this.versionId);
            this.checkLiveUpdate(this.versionId);
          }

          if (this.areArraysDifferentUnordered(this.adsList ?? [], r.adsList ?? [])) {
            try {
              const result = this.getReplacements(this.adsList ?? [], r.adsList ?? []);
              this.adsList = r.adsList;
              localStorage.setItem('adsList', JSON.stringify(this.adsList));
              console.log('Update adsList to', this.adsList);

              console.log('result', result);
              if (result.remove.length > 0) {
                // this.apiService.removeAds(result.remove);
                for (let index = 0; index < result.remove.length; index++) {
                  const element = result.remove[index];
                  await this.videoCacheService.deleteCachedVideo(element);
                  console.log('remove ads', element);

                }
              }
              if (result.add.length > 0) {
                // this.apiService.addAds(result.add);
                for (let index = 0; index < result.add.length; index++) {
                  const element = result.add[index];
                  await this.videoCacheService.getCachedVideoBase64(element);
                  console.log('add ads', element);
                }
              }

            } catch (error) {
              console.log('Error getReplacements', error);

            }

          }

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




        } else {
          console.log('No data from alive');
        }
      } catch (error) {
        Toast.show({ text: 'Error alive ' + JSON.stringify(error || '{}'), duration: 'long' })
      }



    });
    if (this.dbService.getReady()) {
      this.loadCredits().then(r => {
        this.creditPending.push(...r);
        this.creditPending.forEach((v, index) => {
          if (v.transactionID) {
            setTimeout(() => {
              this.sendStatus(v.data.data, Number(v.data.transactionID), v.data.command);
            }, 1000 * index);
          }
        });
        console.log('CREDIT PENDING', this.creditPending);
      });
    } else {
      this.dbService.initializeDatabase().then(r => {
        console.log('Database initialized', r);
        // id: item.id,
        // name: item.name,
        // data: JSON.parse(item.data), // Parse JSON back to object
        // transactionID: item.transactionID,
        // description: item.description,
        this.loadCredits().then(r => {
          this.creditPending.push(...r);
          this.creditPending.forEach((v, index) => {
            if (v.transactionID) {
              setTimeout(() => {
                this.sendStatus(v.data.data, Number(v.data.transactionID), v.data.command);
              }, 1000 * index);
            }
          });
          console.log('CREDIT PENDING', this.creditPending);
        });
      }).catch(e => {
        console.log('Error init database', e);
      })
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


    if (this.serial) {
      this.serial.close();
      console.log('serial closed');
    }
  }


  checkLiveUpdate(version: string) {
    try {
      this.liveUpdateService.checkForUpdates(version).then(async (res) => {
        console.log('checkForUpdates', res);
      }).catch((e) => {
        console.log('Error checkLiveUpdate', e);
      });
    } catch (error) {
      console.log('Error checkLiveUpdate', error);
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
    Toast.show({ text: 'Prepare a connection to ' + this.selectedDevice });
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
    else if (this.selectedDevice == 'Tp77p') {
      await this.satrtTp77p();
      Toast.show({ text: 'Start Tp77p3b' });
    }
    else if (this.selectedDevice == 'essp') {
      await this.startEssp();
      Toast.show({ text: 'Start essp' });
    }
    else if (this.selectedDevice == 'cctalk') {
      await this.startCctalk();
      Toast.show({ text: 'Start essp' });
    }
    else if (this.selectedDevice == 'adh815') {
      await this.startAHD815();
      Toast.show({ text: 'Start adh815' });
    }
    else if (this.selectedDevice == 'm102') {
      await this.startM102();
      Toast.show({ text: 'Start m102' });
    }
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
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initVMC(this.portName, Number(this.baudRate), '', '', this.isSerial);

    if (!this.serial) {
      Toast.show({ text: 'serial not init for start VMC' });
    } else {
      this.serial.getSerialEvents().subscribe(event => {
        try {
          console.log('vmc service event received: ' + JSON.stringify(event));
          if (event.event === 'dataReceived') {
            // this.addLogMessage(`Received: ${event.data}`);
            // this.processVMCResponse(event.data);
            this.processVMCResponse(event.data);
          } else if (event.event === 'commandAcknowledged') {
            console.log('Command acknowledged by VMC:', event.data);
          } else if (event.event === 'error') {
            console.error('Serial error:', event);
            // this.addLogMessage(`Serial error: ${JSON.stringify(event)}`);
          }
        } catch (error: any) {
          console.error('Error processing event:', error);
          // this.addLogMessage(`Error processing event: ${error.message}`);
        }
      });


      Toast.show({ text: 'VMC Cashin', duration: 'long' });
      console.log('VMC Cashin');
      this.offlineMode = Boolean(localStorage.getItem('offlineMode') ?? 'true');

      // // FIX FIRMWARE bugs when reconnect to VMC
      setTimeout(async () => {
        this.isFirstLoad = false;
        if (!this.offlineMode) {
          await this.vendingIndex.vmc.enableCashIn();
          Toast.show({ text: 'CashIn enabled', duration: 'long' });
        }
        else {
          await this.vendingIndex.vmc.disableCashIn();
          Toast.show({ text: 'CashIn disabled', duration: 'long' });
        }
      }, 20000);
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
        await this.serial.close();
        this.serial = null;
        Toast.show({ text: 'serial closed' });
      }
      console.log('starting ZDM8');
      this.serial = await this.vendingIndex.initZDM8(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
      if (!this.serial) {
        Toast.show({ text: 'serial not init ' + this.selectedDevice });
      } else {
        this.serial.getSerialEvents().subscribe(event => {
          try {
            console.log('zdm8 service event received: ' + JSON.stringify(event));
            if (event.event === 'dataReceived') {
              const rawData = event.data; // Assuming event.data contains the raw hex string

              console.log('zdm service Received from device:', rawData);
              const d = typeof rawData === 'object' ? JSON.stringify(rawData) : rawData;
              Toast.show({ text: 'zdm service Received from device: ' + d, duration: 'long' });
              // Process the Modbus response
              // const response = this.zdm8Service.processModbusResponse(rawData);
              // if (response) {
              //   console.log('Processed Modbus response:', response);
              // }
              // Toast.show({ text: 'Processed Modbus response: ' + JSON.stringify(response), duration: 'long' });
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
    } catch (error) {
      Toast.show({ text: 'Error initializing serial: ' + error.message });
    }

  }

  async satrtTp77p() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initPulseTop77p(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startEssp() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initEssp(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startCctalk() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initCctalk(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startAHD815() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initADH815(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startM102() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initM102(this.portName, Number(this.baudRate), this.machineId.machineId, this.machineId.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }

  async runtoast(txt: string, duration: number = 1000) {
    const t = this.apiService.toast.create({ message: `--> ${txt}`, duration: duration });
    (await t).present();
  }


  private processVMCResponse(hex: string): void {
    const t = Number('-21' + moment.now());

    if (hex.startsWith('fafb04')) {
      const t = Number('-21' + moment.now());
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
        const t = Number('-21' + moment.now());
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
            data: { raw: hex, data: hash, t: moment.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.VMC_CREDIT_NOTE },
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
        //   data: { raw: hex, data: hash, t: moment.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.CREDIT_NOTE },
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
    this._checkHowTo_Time = this._checkHowTo_Duration + 1000;
  }

  // autoUpdateCash() {
  //   this.WSAPIService.balanceUpdateSubscription.subscribe(async (r) => {
  //     if (r) {
  //       await this.initVendingWalletCoinBalance();
  //     }
  //   });
  // }

  refreshAllEveryHour() {
    const hour = 60 * 60 * 1000;
    this.refreshAll = setInterval(() => {
      this.refreshAllCounter++;
      if (this.refreshAllCounter == hour) {
        clearInterval(this.refreshAll);
        this.refreshAllCounter = 0;
        // window.location.reload();
        this.apiService.reloadPage();
      }
    }, 1000);
  }
  refresh() {
    // window.location.reload();
    this.apiService.reloadPage();
  }
  initStock() {
    // if (this.vendingOnSale?.length) return;
    this.apiService.loadVendingSale().subscribe((r) => {
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

        const run = await ScreenBrightness.setBrightness({ brightness: 0.0 });
        this.apiService.alertSuccess(`--> run ${run}`)

        // const {brightness: currentBrightness} = await ScreenBrightness.getBrightness();
        const brightness = await ScreenBrightness.getBrightness();
        this.apiService.alertSuccess(`--> bright ${brightness}`)

        resolve(IENMessage.success);

      } catch (error) {
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
          setTimeout(() => {
            this.showBills();
          }, 10000);

          resolve(IENMessage.success);
        } else {
          this.apiService.recoverSale().subscribe((r) => {
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
              setTimeout(() => {
                this.showBills();
              }, 10000);

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
      } catch (error) {
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
  async manageStock() {
    const x = prompt('password');
    console.log(x, this.getPassword());

    if (environment.production)
      if (
        !this.getPassword().endsWith(x?.substring(6)) ||
        !x?.startsWith(this.machineId?.otp) ||
        x?.length < 12
      )
        return;
    const m = await this.apiService.showModal(StocksalePage);
    this.checkActiveModal(m);

    m.onDidDismiss().then((r) => {
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

        // setTimeout(() => {
        //   this.apiService.saveSale(s).subscribe(r=>{
        //     console.log(r);
        //     if(r.status){
        //       console.log(`save sale success`);
        //     } else {
        //       this.apiService.simpleMessage(IENMessage.saveSaleFail);
        //     }
        //   });
        // }, 500);
      });

      // } else {
      //   console.log('Canceled');

      // }
      // window.location.reload();
    });
    m.present();
    this.otherModalAreOpening = true;
    this.openAnotherModal(m);

  }
  // loadPaidBills() {
  //   this.apiService.loadPaidBills().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingBillPaid.push(...r.data);
  //     }
  //   })
  // }
  // loadBills() {
  //   this.apiService.loadBills().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingBill.push(...r.data);
  //     }
  //   })
  // }
  loadOnlineMachine() {
    this.apiService.loadOnlineMachine().subscribe((r) => {
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
    this.apiService.showLoading();
    if (x.stock.price == 0) {
      this.apiService.getFreeProduct(x.position, x.stock.id).subscribe((r) => {
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
              );
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
          this.apiService.dismissLoading();
        }, 3000);
      });
    } else {
      const amount = x.stock.price * 1;

      this.apiService
        .buyLaoQR([x], amount, this.machineId.machineId)
        .subscribe((r) => {
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
                this.apiService.modal
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
            this.apiService.dismissLoading();
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
    this.apiService.showLoading();
    console.log(this.orders, amount);
    this.apiService
      .buyLaoQR(this.orders, amount, this.machineId.machineId)
      .subscribe((r) => {
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
              this.apiService.modal
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
        this.apiService.dismissLoading();
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

  addOrder(x: IVendingMachineSale) {
    try {
      this.autopilot.auto = 0;
      console.log(`allow vending`, this.allowVending);

      console.log('POS', x.position);

      // this.testDrop(x.position);


      if (this.allowVending == false) {
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
        this.apiService.alertError('ປິດໃຊ້ງານຊົ່ວຄາວ, ກະລຸນາລອງໃໝ່ພາຍຫຼັງ');
        // setTimeout(() => {
        //   Swal.close();
        // }, 2000);
        return;
      }

      this.setActive();
      if (!x) return alert('not found');
      const ord = this.orders.filter((v) => v.position == x.position);
      if (ord.length)
        if (ord.length >= x?.stock.qtty) return alert('Out of Stock');
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
  addOrderTest(x: IVendingMachineSale) {
    try {
      this.autopilot.auto = 0;
      console.log(`allow vending`, this.allowVending);

      if (this.allowVending == false) {
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
        if (ord.length >= x?.stock.qtty) return alert('Out of Stock');


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
  1
  showMyOrdersModal() {
    try {
      // timer check payment for any orders
      clearInterval(this.countdownCheckLaoQRPaidTimer);
      this.countdownCheckLaoQRPaidTimer = setInterval(async () => {
        console.log('*****CHECK 5 SECOND');
        // await this._processLoopCheckLaoQRPaid();

        if (this.processedQRPaid) return;
        this.processedQRPaid = true;
        await this._processLoopCheckLaoQRPaid();
        this.processedQRPaid = false;
      }, 5000);

      if (this.otherModalAreOpening == true) return;
      if (this.orders != undefined && Object.entries(this.orders).length == 0) return;
      clearInterval(this.autoShowMyOrderTimer);
      this.autoShowMyOrdersCounter = 15;

      // const component = OrderCartPage;
      const component = AutoPaymentPage;
      const props = {
        orders: this.orders,
        getTotalSale: this.getTotalSale
      }
      const that = this;
      this.apiService.modal.create({ component: component, componentProps: props, cssClass: 'dialog-fullscreen' }).then(r => {
        r.present();
        this.otherModalAreOpening = true;
        // this.apiService.allModals.push(this.apiService.modal);
        r.onDidDismiss().then(cb => {
          this.otherModalAreOpening = false;
          AutoPaymentPage.message?.close();
          AutoPaymentPage.message = undefined;
          if (this.orders != undefined && Object.entries(this.orders).length > 0 && this.checkAppUpdate == false) {
            // this.loadAutoShowMyOrders();
          }
          clearInterval(this.countdownCheckLaoQRPaidTimer);
          that.countdownCheckLaoQRPaidTimer = setInterval(async () => {
            console.log('*****CHECK 30 SECOND');

            // that._processLoopCheckLaoQRPaid();

            if (this.processedQRPaid) return;
            this.processedQRPaid = true;
            await this._processLoopCheckLaoQRPaid();
            this.processedQRPaid = false;

            this.apiService.IndexedDB.getBillProcesses().then((r) => {
              if (r.length > 0) {
                console.log('dropStock', r);
                this.apiService.isDropStock = true;

              } else {
                console.log('out dropStock', r);
                this.apiService.isDropStock = false;
              }
            }).catch((e) => {
              console.log('Error get dropStock from local', e);
              this.apiService.isDropStock = false;
            });
          }, 30000);
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
    this.apiService.machineuuid.split('').forEach((v) => {
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

  // refreshVendingWalletCoinBalance(): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     try {
  //       // const machineId: string = localStorage.getItem('machineId');
  //       const params = {};
  //       const run = await this.loadVendingWalletCoinBalanceProcess.Init(params);
  //       if (run.message != IENMessage.success) throw new Error(run);
  //       this.apiService.cash.amount = run.data[0].vendingWalletCoinBalance;
  //       resolve(IENMessage.success);
  //     } catch (error) {
  //       this.apiService.simpleMessage(error.message);
  //       resolve(error.message);
  //     }
  //   });
  // }
  // initVendingWalletCoinBalance(): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     try {
  //       // const machineId: string = localStorage.getItem('machineId');
  //       const params = {};
  //       const run = await this.loadVendingWalletCoinBalanceProcess.Init(params);
  //       if (run.message != IENMessage.success) throw new Error(run);
  //       this.apiService.cash.amount = run.data[0].vendingWalletCoinBalance;
  //       if (this.apiService.cash.amount > 0)
  //         this.apiService.soundMachineHasSomeChanges();
  //       resolve(IENMessage.success);
  //     } catch (error) {
  //       this.apiService.simpleMessage(error.message);
  //       resolve(error.message);
  //     }
  //   });
  // }
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
        this.apiService.cash.amount = Number(this.apiService.cash.amount) + Number(cashList);

        resolve(IENMessage.success);
      } catch (error) {
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
      } catch (error) {
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
        if (this.apiService.cash.amount < sum_total) {
          await this.apiService.soundPleaseTopUpValue();
          throw new Error(IENMessage.notEnoughtCashBalance);
        }
        const sum_refund = this.apiService.cash.amount - sum_total;

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
          cash: this.apiService.cash.amount,
          quantity: sum_quantity,
          total: sum_total,
          balance: sum_refund,
          paidLAAB: paidLAAB,
        };
        console.log(`props`, props);

        this.apiService.modal
          .create({ component: LaabGoPage, componentProps: props })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.checkActiveModal(r);
            this.openAnotherModal(r);

          });
      } catch (error) {
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
        this.apiService.modal
          .create({ component: EpinCashOutPage, componentProps: {} })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.checkActiveModal(r);
            this.openAnotherModal(r);

          });
      } catch (error) {
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
          this.apiService.modal
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
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  checkActiveModal(rx: HTMLIonModalElement) {
    const t = setInterval(() => {
      this.autopilot.auto = 0;
    }, 1000);
    rx.onDidDismiss().then(rx => {
      clearInterval(t);
      this.reloadAutoPayment();
      // this.loadAutoShowMyOrders();
    });
  }
  laabCashout(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash.amount == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        const props = {};
        this.apiService.modal
          .create({ component: LaabCashoutPage, componentProps: props })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.openAnotherModal(r);
            clearInterval(this.autoShowMyOrderTimer);
            resolve(IENMessage.success);

            this.checkActiveModal(r);
          });
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.apiService.soundPleaseTopUpValue();
        resolve(error.message);
      }
    });
  }



  showBills() {
    console.log(`here`);
    this.apiService.loadDeliveryingBillsNew().then((r) => {
      console.log(`response showBills`, r);
      if (r.length > 0) {
        // this.apiService.dismissModal();
        this.apiService.pb = r as Array<IBillProcess>;
        if (this.apiService.pb.length) {
          this.apiService.isDropStock = true;
          if (!this.apiService.isRemainingBillsModalOpen) {
            this.apiService
              .showModal(RemainingbillsPage, { r: this.apiService.pb, serial: this.serial }, true)
              .then((r) => {
                this.apiService.isRemainingBillsModalOpen = true;
                r.present();
                r.onDidDismiss().then(() => {
                  this.apiService.isRemainingBillsModalOpen = false;
                })
                this.otherModalAreOpening = true;
                this.openAnotherModal(r);
                clearInterval(this.autoShowMyOrderTimer);
                this.checkActiveModal(r);
              });
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
    });
  }

  public openStackCashOutPage(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash.amount == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        // ##here
        this.apiService.modal
          .create({ component: StackCashoutPage })
          .then((r) => {
            r.present();
            this.otherModalAreOpening = true;
            this.openAnotherModal(r);

            clearInterval(this.autoShowMyOrderTimer);
            this.checkActiveModal(r);

          });

        resolve(IENMessage.success);
      } catch (error) {
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

    this.apiService.modal
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
        if (r) this.animateControlMenu(this.links, r);
      });
      clearInterval(i);
    });
  }
  animateControlMenu(links: NodeListOf<HTMLLinkElement>, res?: any) {
    links.forEach((item) => {
      const name = item.className.split(' ')[2];
      if (res) {
        res.forEach((menu) => {
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
        this.apiService.modal
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
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  public openGameServices(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.apiService.modal
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
      } catch (error) {
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
    this.apiService.modal
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
    this.apiService.modal
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

  openTestMotor() {
    if (!this.t) {
      this.t = setTimeout(() => {
        this.count = 10;
        console.log('re count');
        if (this.t) {
          // clearTimeout(this.t);
          this.t = null;
        }
      }, 1500);
    }
    if (--this.count <= 0) {
      this.count = 10;
      const x = prompt('password');
      console.log(x, this.getPassword());

      if (!this.getPassword().endsWith(x.substring(6)) || !x.startsWith(this.apiService.machineId?.otp) || x.length < 12) return;

      const xp = prompt('password1');
      if (xp + '' == '1234567890_5martH67_laoapps') {
        console.log('xp', xp);
        this.serial.close();
        this.apiService.modal.create({
          component: TestmotorPage,
          componentProps: { serial: this.serial }
        }).then(r => {
          r.present();
          r.onDidDismiss().then(r => {
            this.serial.close();
          })
        })

        if (this.t) {
          clearTimeout(this.t);
          this.t = null;
        }
      } else {
        this.apiService.alertError('ບໍ່ໄດ້ແດກກູດອກ ຮາຮາ ມັນບໍ່ໄດ້ມີຫຍັງ ເຮັດມາຫຼອກເດັກຊື່ໆ');
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
    this.apiService.modal
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

  openAnotherModal(r) {
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

  repairText: string;
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

      } catch (error) {
        this.otherModalAreOpening = false;
        this.displayRepaireAppVersion = false;
        this.apiService.alertError(error.message);
        clearInterval(this.loopPercent);
        resolve(error.message);
      }
    });
  }
  refreshBalanceFromAnotherModal(balance: number) {
    this.apiService.cash.amount = balance;
  }

  resetCashing(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const ownerUuid = localStorage.getItem('machineId');
        if (ownerUuid) {
          await this.cashingService.remove(ownerUuid);
          // window.location.reload();
          this.apiService.reloadPage();
        }

        resolve(IENMessage.success);
      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }
  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }
}
