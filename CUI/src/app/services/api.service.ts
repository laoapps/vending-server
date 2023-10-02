import { Component, ComponentRef, Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  EClientCommand,
  EPaymentProvider,
  IAlive,
  IBillProcess,
  IClientId,
  IMachineClientID,
  IMachineId,
  IReqModel,
  IResModel,
  IStock,
  IVendingMachineBill,
  IVendingMachineSale,
} from './syste.model';
import { WsapiService } from './wsapi.service';
import * as cryptojs from 'crypto-js';
import { environment } from 'src/environments/environment';
import {
  AlertController,
  LoadingController,
  ModalController,
  ModalOptions,
  ToastController,
} from '@ionic/angular';
// import { NotifierService } from 'angular-notifier';
import moment from 'moment';
import * as uuid from 'uuid';
import { IonicStorageService } from '../ionic-storage.service';
import { EventEmitter } from 'events';
import { RemainingbillsPage } from '../remainingbills/remainingbills.page';
import { Tab1Page } from '../tab1/tab1.page';
import { IENMessage } from '../models/base.model';
import { IMachineStatus, hex2dec } from './service';
import { ControlMenuService } from './control-menu.service';
import axios from 'axios';
import Swal from "sweetalert2";
import { BehaviorSubject } from 'rxjs';
import { EpinCashOutPageModule } from '../tab1/LAAB/epin-cash-out/epin-cash-out.module';
import { EpinShowCodePageModule } from '../tab1/LAAB/epin-show-code/epin-show-code.module';
import { LaabCashinShowCodePageModule } from '../tab1/LAAB/laab-cashin-show-code/laab-cashin-show-code.module';
import { LaabCashoutPageModule } from '../tab1/LAAB/laab-cashout/laab-cashout.module';
import { LaabGoPageModule } from '../tab1/LAAB/laab-go/laab-go.module';
import { MmoneyCashoutPageModule } from '../tab1/LAAB/mmoney-cashout/mmoney-cashout.module';
import { SmcListPageModule } from '../tab1/LAAB/smc-list/smc-list.module';
import { StackCashoutPageModule } from '../tab1/LAAB/stack-cashout/stack-cashout.module';
import { TopupServicePageModule } from '../tab1/LAAB/topup-service/topup-service.module';
import { MmoneyIosAndroidDownloadPageModule } from '../tab1/MMoney/mmoney-ios-android-download/mmoney-ios-android-download.module';
import { HowToPageModule } from '../tab1/Vending/how-to/how-to.module';
import { OrderCartPageModule } from '../tab1/Vending/order-cart/order-cart.module';
import { OrderPaidPageModule } from '../tab1/Vending/order-paid/order-paid.module';
import { PhonePaymentPageModule } from '../tab1/Vending/phone-payment/phone-payment.module';
import { PlayGamesPageModule } from '../tab1/Vending/play-games/play-games.module';
import { TopupAndServicePageModule } from '../tab1/Vending/topup-and-service/topup-and-service.module';
import { VendingGoPageModule } from '../tab1/Vending/vending-go/vending-go.module';
import { HangmiFoodSegmentPageModule } from '../tab1/VendingSegment/hangmi-food-segment/hangmi-food-segment.module';
import { HangmiStoreSegmentPageModule } from '../tab1/VendingSegment/hangmi-store-segment/hangmi-store-segment.module';
import { TopupAndServiceSegmentPageModule } from '../tab1/VendingSegment/topup-and-service-segment/topup-and-service-segment.module';
import { EpinCashOutPage } from '../tab1/LAAB/epin-cash-out/epin-cash-out.page';
import { EpinShowCodePage } from '../tab1/LAAB/epin-show-code/epin-show-code.page';
import { LaabCashinShowCodePage } from '../tab1/LAAB/laab-cashin-show-code/laab-cashin-show-code.page';
import { LaabCashoutPage } from '../tab1/LAAB/laab-cashout/laab-cashout.page';
import { LaabGoPage } from '../tab1/LAAB/laab-go/laab-go.page';
import { MmoneyCashoutPage } from '../tab1/LAAB/mmoney-cashout/mmoney-cashout.page';
import { SmcListPage } from '../tab1/LAAB/smc-list/smc-list.page';
import { StackCashoutPage } from '../tab1/LAAB/stack-cashout/stack-cashout.page';
import { TopupServicePage } from '../tab1/LAAB/topup-service/topup-service.page';
import { MmoneyIosAndroidDownloadPage } from '../tab1/MMoney/mmoney-ios-android-download/mmoney-ios-android-download.page';
import { HowToPage } from '../tab1/Vending/how-to/how-to.page';
import { OrderCartPage } from '../tab1/Vending/order-cart/order-cart.page';
import { OrderPaidPage } from '../tab1/Vending/order-paid/order-paid.page';
import { PhonePaymentPage } from '../tab1/Vending/phone-payment/phone-payment.page';
import { PlayGamesPage } from '../tab1/Vending/play-games/play-games.page';
import { TopupAndServicePage } from '../tab1/Vending/topup-and-service/topup-and-service.page';
import { VendingGoPage } from '../tab1/Vending/vending-go/vending-go.page';
import { HangmiFoodSegmentPage } from '../tab1/VendingSegment/hangmi-food-segment/hangmi-food-segment.page';
import { HangmiStoreSegmentPage } from '../tab1/VendingSegment/hangmi-store-segment/hangmi-store-segment.page';
import { TopupAndServiceSegmentPage } from '../tab1/VendingSegment/topup-and-service-segment/topup-and-service-segment.page';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  

  toggleWebviewTab: boolean = false;


  vendingGoPageSound() {
    this.soundPaymentMethod();
    setTimeout(() => {
      this.soundMmoneyPaymentMethod();
    }, 2000);
    setTimeout(() => {
      this.soundLaabPaymentMethod();
    }, 3000);
  }
  epinCashOutPageSound() {
    this.soundTargetEPIN();
    setTimeout(() => {
      this.soundInputSecretPassword();
    }, 2000);
  }
  initGreetingSound() {
    this.soundGreeting();
    setTimeout(() => {
      this.soundPleaseVisit();
    }, 5000);

    setTimeout(() => {

      if (new Date().getTime() % 2) {
        setTimeout(() => {
          this.soundPointToCashOut();
        }, 5000);
        setTimeout(() => {
          this.soundPleaseViewVideo();
        }, 10000);
        setTimeout(() => {
          this.soundCheckTicketsExist();
        }, 15000);
        setTimeout(() => {
          if (this.cash.amount > 0) this.soundMachineHasSomeChanges();
        }, 20000);
      }

    }, 10000);
  }
  endProcessBillSound() {
    this.soundCompleted();
    // setTimeout(() => {
    //     this.soundThankYou();
    // }, 2000);
  }

  // ___LaabGoPage:LaabGoPage
  // ___EpinCashOutPage:EpinCashOutPage
  // ___EpinShowCodePage:EpinShowCodePage
  // ___SmcListPage:SmcListPage
  // ___LaabCashinShowCodePage:LaabCashinShowCodePage
  // ___LaabCashoutPage:LaabCashoutPage
  // ___StackCashoutPage:StackCashoutPage
  // ___MmoneyIosAndroidDownloadPage:MmoneyIosAndroidDownloadPage
  // ___TopupServicePage:TopupServicePage
  // ___TopupAndServicePage:TopupAndServicePage
  // ___PhonePaymentPage:PhonePaymentPage
  // ___VendingGoPage:VendingGoPage
  // ___HowToPage:HowToPage
  // ___MmoneyCashoutPage:MmoneyCashoutPage
  // ___HangmiStoreSegmentPage:HangmiStoreSegmentPage
  // ___HangmiFoodSegmentPage:HangmiFoodSegmentPage
  // ___TopupAndServiceSegmentPage:TopupAndServiceSegmentPage
  // ___PlayGamesPage:PlayGamesPage
  // ___OrderCartPage:OrderCartPage
  // ___OrderPaidPage:OrderPaidPage

  public static __percent: any;

  ___LaabGoPage:any
  ___EpinCashOutPage:any
  ___EpinShowCodePage:any
  ___SmcListPage:any
  ___LaabCashinShowCodePage:any
  ___LaabCashoutPage:any
  ___StackCashoutPage:any
  ___MmoneyIosAndroidDownloadPage:any
  ___TopupServicePage:any
  ___TopupAndServicePage:any
  ___PhonePaymentPage:any
  ___VendingGoPage:any
  ___HowToPage:any
  ___MmoneyCashoutPage:any
  ___HangmiStoreSegmentPage:any
  ___HangmiFoodSegmentPage:any
  ___TopupAndServiceSegmentPage:any
  ___PlayGamesPage:any
  ___OrderCartPage:any
  ___OrderPaidPage:any
  ___AutoPaymentPage:any

  backGroundMusicElement: HTMLAudioElement = {} as any;
  muteSound = false;
  backgrounSound = true;

  eventEmmiter = new EventEmitter();
  howtoVideoPlayList: Array<any> = [
    {
      id: 1,
      video: 'assets/video-how-to/howto1.webm',
      cover: 'assets/video-how-to/howto1-cover.webp',
      title: 'How to 1',
      subtitle: 'Step 1',
      file: '',
    },
    {
      id: 2,
      video: 'assets/video-how-to/howto2.webm',
      cover: 'assets/video-how-to/howto2-cover.png',
      title: 'How to 2',
      subtitle: 'Step 2',
      file: '',
    },
    {
      id: 3,
      video: 'assets/video-how-to/howto3.webm',
      cover: 'assets/video-how-to/howto3-cover.png',
      title: 'How to 3',
      subtitle: 'Step 3',
      file: '',
    },
  ];

  bill_price: Array<number> = [];
  bill_image: Array<string> = [];

  myTab1: Tab1Page;

  cash = { amount: 0 };
  coinListId: string;
  coinCode: string;
  coinName: string;
  name: string;
  laabuuid: string;

  imageList: any = {};

  _billEvents = new EventEmitter();
  stock = new Array<IStock>();
  eventEmitter = new EventEmitter();
  pb = Array<IBillProcess>();
  machineuuid = uuid.v4();
  url = localStorage.getItem('url') || environment.url;
  wsurl = localStorage.getItem('wsurl') || environment.wsurl;
  contact = localStorage.getItem('contact') || '55516321';
  currentPaymentProvider = EPaymentProvider.mmoney;
  machineId = {} as IMachineId;

  clientId = {} as IClientId;

  wsAlive = {} as IAlive;
  autopilot = { auto: 0 };
  public static vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();
  test = { test: false };
  static __T: any;
  static waiting_T: any;

  _machineStatus = { status: {} as IMachineStatus } as any;
  _cuiSetting = {} as any;
  musicVolume=6;

  countErrorPay: number = 0;

  checkAppVersion: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  constructor(
    public controlMenuService: ControlMenuService,

    public http: HttpClient,
    public wsapi: WsapiService,
    public toast: ToastController,
    public modal: ModalController,
    // public notifyService: NotifierService,
    public storage: IonicStorageService,

    public load: LoadingController,
    public alert: AlertController
  ) {
    if (!localStorage.getItem('remoteProcess')) localStorage.setItem('remoteProcess', 'yes');
    const that = this;
    this.wsapi = wsapi;
    this.muteSound = localStorage.getItem('isRobotMuted')?true:false;
    this.backgrounSound = localStorage.getItem('isMusicMuted')?true:false;
    this.musicVolume = localStorage.getItem('musicVolume')?Number(localStorage.getItem('musicVolume')):6;
    setTimeout(() => {
      this.playBackGroundMusic();
    }, 3000);
    
    // this.zone.runOutsideAngular(() => {
    this.machineId.machineId = localStorage.getItem('machineId') || '12345678';
    this.machineId.otp = localStorage.getItem('otp') || '111111';
    this.wsapi.connect(
      this.wsurl,
      this.machineId.machineId,
      this.machineId.otp
    );


    this.wsapi.aliveSubscription.subscribe(r => {
      console.log('ALIVE', r);
      const response: any = r;

      try {
        if (!r) return console.log('empty');
        console.log('ws alive subscription', that.cash, r);

        that.cash.amount = r.balance;
        that.wsAlive.time = new Date();
        that.wsAlive.isAlive = that.checkOnlineStatus();
        that.test.test = r?.test;


        // reconfirm when deductstock fail
        if (response.data.pendingStock != undefined && Object.entries(response.data.pendingStock).length > 0) {
          this.reconfirmStock(response.data.pendingStock);
        }


        // if (!this.vendingOnSale.length) {
        //   setTimeout(() => {
        //     window.location.reload();
        //   }, 3000);
        //   this.validateDB();
        // }
        if (r.balance) {
          if (that.cash.amount < r.balance) that.soundLaabIncreased();
          that.cash.amount = r.balance;
        }

        that._machineStatus.status = r.data.mstatus;
        that._machineStatus.status.temp = hex2dec(
          that._machineStatus.status.temp
        );
        const cset =r.data.setting;
        that._cuiSetting.imgHeader != cset.imgHeader||(that._cuiSetting.imgHeader = cset.imgHeader);
        that._cuiSetting.imgLogo != cset.imgLogo||(that._cuiSetting.imgLogo = cset.imgLogo);
        that._cuiSetting.imgFooter != cset.imgFooter||(that._cuiSetting.imgFooter = cset.imgFooter);

        if (!that._cuiSetting?.imgHeader) that._cuiSetting.imgHeader = {"background":"url(\'../../assets/background/1910.jpg\') rgb(255, 255, 255) no-repeat center fixed","background-size": "contain"};
        
        // if(!this._cuiSetting.imgFooter)this._cuiSetting.imgHeader="url('../../assets/background/1910.jpg')";
        // if(!this._cuiSetting.imgLogo)this._cuiSetting.imgHeader="url('../../assets/background/1910.jpg')";

        // control version
        const app_version = response.data.app_version;
        const local_version = localStorage.getItem('app_version');

        if (app_version != undefined && Object.entries(app_version).length > 0)
        { 

          // * update
          if (local_version == null) {
            this.checkAppVersion.next(app_version);
          } else {
            const parseLocalVersion = JSON.parse(local_version);
            const appVersion = parseInt(app_version.version);
            const localVersion = parseInt(parseLocalVersion.version);

            // update
            if (appVersion != localVersion) this.checkAppVersion.next(app_version);
          }
        }


      } catch (error) {
        console.log('error', error);
      }
    });

    this.wsapi.refreshSubscription.subscribe((r) => {
      console.log(`refreshing`, r);
      if (r) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    });

    // this.wsapi.vsales =ApiService.vendingOnSale;
    this.wsapi.onBillProcess((r) => {
      if (!r) return console.log('empty');
      console.log('ws process subscription', r);
      const message =
        'processing slot ' +
        r.position +
        `==>${r.position}` +
        '; ' +
        r?.bill?.vendingsales?.find((v) => v.position == r.position)?.stock
          ?.name;

      // const x = this.vendingOnSale?.find(v => r?.bill?.vendingsales.find(vx => vx.stock.id == v.stock.id && r.position.position + '' == vx.position + ''));
      
      const params = {
        trans: [
          { 
            transactionID: r.bill?.transactionID, position: r?.position

          }
        ]
      }
      this.confirmDeductStock(params).subscribe(res_confirm => {
        console.log(`confirm deduct stock`, res_confirm);
        if (res_confirm.status != 1) throw new Error(res_confirm.message);

        const vsales = ApiService.vendingOnSale; 
        const x = vsales.find((v) => {
          if (v.position == r.position) {
            v.stock.qtty--;
            return true;
          }
        });
        this.eventEmitter.emit('stockdeduct', x);
        this.saveSale(vsales).subscribe((r) => {
          console.log(r);
          if (r.status) {
            console.log(`save sale success`);
          } else {
            this.simpleMessage(IENMessage.saveSaleFail);
          }
        });
        console.log('X', x, r.position, x && r.position);
  
        if (x && r.position) {
          // # save to machine
          console.log('saveSale', vsales);
  
          // this.clearWaitingT();
  
          // PLAY SOUNDS
          this.soundCompleted();
          setTimeout(() => {
            this.soundThankYou();
          }, 2000);
          that.toast.create({ message, duration: 2000 }).then(r => {
            r.present();
          });
  
          r.bill.updatedAt = new Date();
        } else if (!r.position) {
          // PLAY SOUNDS
          this.soundSystemError();
          this.alert
            .create({
              header: 'Alert',
              message,
              buttons: [
                {
                  text: 'OK',
                  role: 'confirm',
                  handler: () => { },
                },
              ],
            })
            .then((v) => v.present());
        }
  
        console.log(`vendingOnSale-->`, vsales);
        this.storage.set('saleStock', vsales, 'stock').then((r) => {
          // that.deductOrderUpdate(x.position);
        });
      }, error => {
        console.log(error.message);
        this.alertError(error.message);
      });



      // });
    });
    this.wsapi.waitingDelivery.subscribe((r) => {
      console.log('WAITING FOR DELIVERY');
      // available bills

      if (r) {
        this.dismissModal();
        this.dismissModal();
        this.dismissLoading();
        this.loadDeliveryingBills().subscribe((r) => {
          if (r.status) {
            this.dismissModal();
            const pb = r.data as Array<IBillProcess>;
            if (pb.length)
              this.showModal(RemainingbillsPage, { r: pb }, false).then((r) => {
                r.present();
              });
          } else {
            this.toast
              .create({ message: r.message, duration: 5000 })
              .then((r) => {
                r.present();
              });
          }
        });
        // this.showModal(RemainingbillsPage, { r });
      }
    });

    // this.initLocalHowToVideoPlayList();
  }
  public onStockDeduct(cb: (data) => void) {
    if (cb) {
      this.eventEmmiter.on('stockdeduct', cb);
    }
  }

  // public getVSales() {
  //   return ApiService.vendingOnSale;
  // }

  reconfirmStock(pendingStock: Array<{ transactionID: any, position: number }>) {
    const params = {
      trans: pendingStock
    }
    this.confirmDeductStock(params).subscribe(res_confirm => {
      console.log(`return confirm deduct stock`, res_confirm);
      if (res_confirm.status != 1) throw new Error(res_confirm.message);

      const vsales = ApiService.vendingOnSale; 
      const x = vsales.find((v) => {
        pendingStock.filter(item => {
          if (v.position == item.position) {
            v.stock.qtty--;
            return true;
          }
        });
      });
      this.eventEmitter.emit('stockdeduct', x);
      this.saveSale(vsales).subscribe((r) => {
        console.log(r);
        if (r.status) {
          console.log(`save sale success`);
        } else {
          this.simpleMessage(IENMessage.saveSaleFail);
        }
      });

      console.log(`pending stock mode vendingOnSale-->`, vsales);
      this.storage.set('saleStock', vsales, 'stock').then((r) => {
        // that.deductOrderUpdate(x.position);
      });
    }, error => {
      console.log(error.message);
      this.alertError(error.message);
    });
  }
  public validateDB() { }
  public onDeductOrderUpdate(cb: (position: number) => void) {
    this.eventEmitter.on('deductOrderUpdate', cb);
  }
  public deductOrderUpdate(position: number) {
    this.eventEmitter.emit('deductOrderUpdate', position);
  }
  public checkOnlineStatus() {
    if (this.wsAlive) {
      return (
        moment().get('milliseconds') -
        moment(this.wsAlive.time).get('milliseconds') <
        10 * 1000
      );
    } else {
      return false;
    }
  }
  public dismissModal(data: any = null) {
    this.modal.getTop().then((r) => {
      r ? this.modal.dismiss({ data }) : null;
    });
  }

  
  public alertSuccess(text: string) {
    Swal.fire({
      icon: 'success',
      title: 'Successfully',
      text: text,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#28B463',
      heightAuto: false,
      timer: 5000
    });

    // setTimeout(() => {
    //   Swal.close();
    // }, 5000);
  }
  public alertError(text: string) {
    Swal.fire({
      icon: 'error',
      title: 'Fail',
      text: text,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#CB4335',
      heightAuto: false,
      timer: 5000

    });
    // setTimeout(() => {
    //   Swal.close();
    // }, 5000);
  }
  public alertWarnning(title: string,text: string) {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: text,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#CB4335',
      heightAuto: false,
      timer: 5000

    });
    // setTimeout(() => {
    //   Swal.close();
    // }, 5000);
  }
  public alertErrorNoDimiss(text: string) {
    const alert = Swal.fire({
      icon: 'error',
      title: 'Fail',
      text: text,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#CB4335',
      heightAuto: false
    });
    return alert;
  }
  public alertConfirm(text: string) {
    const alert = Swal.fire({ 
      icon: 'question',
      title: 'Are you sure!?',
      text: text,
      showConfirmButton: true,
      confirmButtonText: 'Confirm',
      confirmButtonColor: '#CB4335',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#5D6D7E',
      heightAuto: false
    });
    return alert;
  }

  
  public updateOnlineStatus() {
    this.wsAlive.isAlive = this.checkOnlineStatus();
    // console.log(this.wsAlive.time);

    return this.wsAlive.time;
  }
  private headerBase(): any {
    const token = localStorage.getItem('token');
    //const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    var headers = new HttpHeaders();
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept', 'application/json');
    headers.append('content-type', 'application/json');
    //let options = new RequestOptions({ headers:headers})
    return headers;
  }
  public async saveImage(id: number, base64: string, db = 'image') {
    return this.storage.set2(id + '', base64, db);
  }
  public async getImageBase64(id: number, db = 'image') {
    return await this.storage.get2(id + '', db);
  }

  newProductItems(s: Array<IVendingMachineSale>) {
    this.stock.length = 0;
    s.map((vs) => vs.stock).forEach((v) => {
      console.log('stock', v);

      if (!this.stock.find((y) => y.id == v.id))
        this.stock.push(JSON.parse(JSON.stringify(v)));
    });
    console.log(`new stock`, this.stock);
    this.storage.set('productItems', this.stock, 'item');
  }

  updateStockItems(s: Array<IStock>) {
    s.forEach((v) => {
      // console.log('stock',v);

      if (!this.stock.find((y) => y.id == v.id))
        this.stock.push(JSON.parse(JSON.stringify(v)));
    });
    this.storage.set('productItems', this.stock, 'item');
  }

  async showModal(component: any, d: any = {}, closebyblackdrop: boolean = true) {
    try {
      // let x = '{';
      // const l = Object.keys(d).length;
      // if (!l) {
      //   Object.keys(d).forEach((v, i) => {
      //     i < l ?
      //       x += '"' + v + '":"' + d[v] + '",' : x += '"' + v + '":"' + d[v] + '"';
      //   });
      // }
      // x += '}';
      // const data = JSON.parse(x);
      return await this.modal.create({
        component,
        componentProps: d,
        cssClass: 'dialog-fullscreen',
        backdropDismiss: closebyblackdrop
      });
    } catch (error) {
      console.log('ERROR', error);
      this.toast.create({ message: 'Error', duration: 2000 }).then((r) => {
        r.present();
      });
    }
  }
  closeModal(data: any = null) {
    this.modal.getTop().then((r) => {
      r ? r.dismiss(data) : null;
    });
  }
  initDemo() {
    return this.http.get<IResModel>(
      this.url + '/init?machineId=' + this.machineId.machineId,
      { headers: this.headerBase() }
    );
  }
  loadVendingSale(isActive = 'yes') {
    const req = {} as IReqModel;
    req.command = EClientCommand.list;
    req.data = {
      clientId: this.clientId.clientId,
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs
      .SHA256(this.machineId.machineId + this.machineId.otp)
      .toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    console.log(`req der`, req);
    return this.http.post<IResModel>(
      this.url + '/machineSaleList?isActive=' + isActive,
      req,
      { headers: this.headerBase() }
    );
  }

  loadOnlineMachine() {
    return this.http.get<IResModel>(this.url + '/getOnlineMachines', {
      headers: this.headerBase(),
    });
  }
  loadDeliveryingBills() {
    return this.http.post<IResModel>(
      this.url + '/getDeliveryingBills',
      {
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  getMMoneyUserInfo(phonenumber: string) {
    return this.http.post<IResModel>(
      this.url + `/getMmoneyUserInfo?phonenumber=${phonenumber}`,
      {
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  saveSale(data: any) {
    return this.http.post<IResModel>(
      this.url + '/saveMachineSale',
      {
        data,
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  recoverSale() {
    return this.http.post<IResModel>(
      this.url + '/readMachineSale',
      {
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  confirmDeductStock(data: any) {
    return this.http.post<IResModel>(
      this.url + '/confirmMachineDeductStock',
      {
        data,
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  loadPaidBills() {
    return this.http.post<IResModel>(this.url + '/getPaidBills', {
      headers: this.headerBase(),
    });
  }
  loadBills() {
    return this.http.post<IResModel>(this.url + '/getBills', {
      headers: this.headerBase(),
    });
  }
  // if there is a new ads then remove the old ones 
  loadAds(existIds:Array<number>) {
    return this.http.post<IResModel>(
      this.url + '/loadAds',
      {
        existIds,
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  retryProcessBill(T: string, position: number) {
    return this.http.post<IResModel>(
      this.url + '/retryProcessBill?T=' + T + '&position=' + position,
      {
        token: cryptojs
          .SHA256(this.machineId.machineId + this.machineId.otp)
          .toString(cryptojs.enc.Hex),
      },
      { headers: this.headerBase() }
    );
  }
  retryProcessBillLocal(T: string, position: number) {
    const p = { command: 'process', data: { slot: position }, transactionID: T };
    return this.http.post<IResModel>('http://localhost:19006/', p, {
      headers: this.headerBase(),
    });
  }

  buyMMoney(ids: Array<IVendingMachineSale>, value: number, machineId: string) {
    this.currentPaymentProvider = EPaymentProvider.mmoney;
    const req = {} as IReqModel;
    req.command = EClientCommand.buyMMoney;
    req.data = {
      ids,
      value,
      clientId: this.clientId.clientId,
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs
      .SHA256(this.machineId.machineId + this.machineId.otp)
      .toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    return this.http.post<IResModel>(this.url, req, {
      headers: this.headerBase(),
    });
  }
  

  getFreeProduct(position: number, id: number) {
    this.currentPaymentProvider = EPaymentProvider.mmoney;
    const req = {} as IReqModel;
    req.data = {
      position,
      clientId: this.clientId.clientId,
      id,
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs
      .SHA256(this.machineId.machineId + this.machineId.otp)
      .toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    return this.http.post<IResModel>(this.url + '/getFreeProduct', req, {
      headers: this.headerBase(),
    });
  }
  showLoading(message = 'loading...', t = 15000) {
    return new Promise((resolve, reject) => {
      this.load.create({ message, duration: t }).then((r) => {
        r.present();
        resolve(null);
      });
    });
  }
  dismissLoading() {
    return new Promise((resolve, reject) => {
      this.load.getTop().then((v) => {
        v ? this.load.dismiss() : null;
        resolve(null);
      });
    });
  }

  audioElement: HTMLAudioElement = {} as any;
  playBackGroundMusic(path ='../../assets/background_music.mp3'){
    try {
      if (this.backgrounSound) return;
      this.backGroundMusicElement.src = path;
      this.backGroundMusicElement.loop=true;
      this.backGroundMusicElement.volume=this.musicVolume/100;
      this.backGroundMusicElement.play();
    } catch (error) {
      console.log(error);

    }
  }
  playSound(path: string) {
    try {
      if (this.muteSound) return;
      this.audioElement.src = path;
      this.audioElement.play();
    } catch (error) {
      console.log(error);

    }
  }
  simpleMessage(text: string, time: number = 2000) {
    this.toast
      .create({ message: text, duration: time })
      .then((r) => r.present());
  }

  soundSystemError(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-f-call-center-service.mp3',
        '../../assets/lao-voices/lo-la-f-sorry-check-the-system.mp3',
        '../../assets/lao-voices/lo-la-m-sorry-check-the-system.mp3',
        '../../assets/lao-voices/lo-la-m-please-report.mp3',
      ];
      try {
        this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundPleaseVisit(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-f-let-us-serve-you.mp3',
        '../../assets/lao-voices/lo-la-m-let-us-serve-you.mp3',
        '../../assets/lao-voices/lo-la-let-us-serve-you3.mp3',
        '../../assets/lao-voices/lo-la-let-us-serve-you4.mp3',
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundPleaseWait(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-f-please-wait.mp3',
        '../../assets/lao-voices/lo-la-m-waiting-for-your-item.mp3',
        '../../assets/lao-voices/lo-la-m-waiting-for-your-item2.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundPleaseViewVideo(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-f-view-video-for-more-info.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundThankYou(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-f-wish-much-luck.mp3',
        '../../assets/lao-voices/lo-la-f-wish-the-best-luck-always.mp3',
        '../../assets/lao-voices/lo-la-m-wish-much-luck.mp3',
        '../../assets/lao-voices/lo-la-m-wish-the-best-luck-always.mp3',
        '../../assets/lao-voices/lo-la-m-please-buy-more.mp3',
        '../../assets/lao-voices/lo-la-m-thank-you.mp3',
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundGreeting(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-f-wish-much-luck.mp3',
        '../../assets/lao-voices/lo-la-f-wish-the-best-luck-always.mp3',
        '../../assets/lao-voices/lo-la-m-wish-much-luck.mp3',
        '../../assets/lao-voices/lo-la-m-wish-the-best-luck-always.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundPointToCashOut(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-cashout-on-the-right-hand.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundCompleted(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-completed.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundPaymentMethod(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-what-is-your-payment-method.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundLaabPaymentMethod(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-laab-payment.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundMmoneyPaymentMethod(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-mmoney-payment.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundInputLaabPhonenumber(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-input-laab-phonenumber.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundInputMmoneyPhonenumber(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-input-mmoney-phonenumber.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundInputSecretPassword(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-input-secret-password.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundLaabIncreased(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-laab-increased.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundOtherServices(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-other-services.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  soundPleaseSelect(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-please-select.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundPleaseTopUpValue(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-please-topup-or-insert-bank-note.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundSelectTarget(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-select-target.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundTargetEPIN(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-target-is-epin.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundTargetMMoney(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-transfer-to-mmoney.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundTargetLAAB(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-transfer-to-laab.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundCheckTicketsExist(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-tickets-exist.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  soundMachineHasSomeChanges(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const arr = [
        '../../assets/lao-voices/lo-la-m-we-have-some-changes.mp3'
      ]
      try {
         this.playSound(arr[Math.floor(Math.random() * arr.length)]);
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  convertBlobToBase64(blob: Blob): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        let base64: string = '';
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          resolve(event.target.result as string);
        });
        reader.readAsDataURL(blob);
        console.log(`base64 der`, base64);
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  convertLocalFilePath(local_path: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        // const run = await fetch(local_path);
        // const blob = await run.blob();

        const run = await axios({
          method: 'GET',
          url: local_path,
          responseType: 'blob',
        });

        console.log(`data--->`, run.data);
        resolve(URL.createObjectURL(run.data));

        // fetch(this.howtoVideoPlayList[i].video).then(r => r.blob()).then(blob => {
        //   this.howtoVideoPlayList[i].file = blob;
        // });

        // resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  displayImage(name: string) {
    return this.imageList[name].filter((item) => item.name == name)[0]?.file;
  }

  formatMoney(s: number) {
    return s.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  closeAllModal() {
    // OrderCartPage.static_apiService.dismiss();
    // OrderPaidPage.static_apiService.dismiss();
    // LaabGoPage
    // EpinCashOutPage
    // EpinShowCodePage
    // SmcListPage
    // LaabCashinShowCodePage
    // LaabCashoutPage
    // StackCashoutPage
    // MmoneyIosAndroidDownloadPage
    // TopupServicePage
    // TopupAndServicePage
    // PhonePaymentPage
    // VendingGoPage
    // HowToPage
    // MmoneyCashoutPage
    // HangmiStoreSegmentPage
    // HangmiFoodSegmentPage
    // TopupAndServiceSegmentPage
    // PlayGamesPage
    // OrderCartPage
    // OrderPaidPage
    
    this.___LaabGoPage?.dismiss();
    this.___EpinCashOutPage?.dismiss();
    this.___EpinShowCodePage?.dismiss();
    this.___SmcListPage?.dismiss();
    this.___LaabCashinShowCodePage?.dismiss();
    this.___LaabCashoutPage?.dismiss();
    this.___StackCashoutPage?.dismiss();
    this.___MmoneyIosAndroidDownloadPage?.dismiss();
    this.___TopupServicePage?.dismiss();
    this.___TopupAndServicePage?.dismiss();
    this.___PhonePaymentPage?.dismiss();
    this.___VendingGoPage?.dismiss();
    this.___HowToPage?.dismiss();
    this.___MmoneyCashoutPage?.dismiss();
    this.___HangmiStoreSegmentPage?.dismiss();
    this.___HangmiFoodSegmentPage?.dismiss();
    this.___TopupAndServiceSegmentPage?.dismiss();
    this.___PlayGamesPage?.dismiss();
    this.___OrderCartPage?.dismiss();
    this.___OrderPaidPage?.dismiss();
    this.___OrderPaidPage?.dismiss();
    this.___AutoPaymentPage?.dismiss();
  }
}
