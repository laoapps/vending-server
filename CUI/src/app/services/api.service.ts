import { Component, ComponentRef, Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EClientCommand, EPaymentProvider, IAlive, IBillProcess, IClientId, IMachineClientID, IMachineId, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale } from './syste.model';
import { WsapiService } from './wsapi.service';
import * as cryptojs from 'crypto-js';
import { environment } from 'src/environments/environment';
import { AlertController, LoadingController, ModalController, ModalOptions, ToastController } from '@ionic/angular';
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
import axios from "axios";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  howtoVideoPlayList: Array<any> = [
    {
      id: 1,
      video: 'assets/video-how-to/howto1.webm',
      cover: 'assets/video-how-to/howto1-cover.webp',
      title: 'How to 1',
      subtitle: 'Video is expend about how to use basic vending function',
      file: ''
    },
    {
      id: 2,
      video: 'assets/video-how-to/howto2.webm',
      cover: 'assets/video-how-to/howto2-cover.png',
      title: 'How to 2',
      subtitle: 'Video is expend about how to use basic vending function',
      file: ''
    },
    {
      id: 3,
      video: 'assets/video-how-to/howto3.webm',
      cover: 'assets/video-how-to/howto3-cover.png',
      title: 'How to 3',
      subtitle: 'Video is expend about how to use basic vending function',
      file: ''
    }
  ];


  bill_price: Array<number> = [];
  bill_image: Array<string> = [];

  myTab1: Tab1Page;

  cash: number = 0;
  coinListId: string;
  coinCode: string;
  coinName: string;
  name: string;
  laabuuid: string;





  _billEvents = new EventEmitter();
  stock = new Array<IStock>();
  eventEmitter = new EventEmitter();
  pb = Array<IBillProcess>();
  machineuuid = uuid.v4()
  url = localStorage.getItem('url') || environment.url;
  wsurl = localStorage.getItem('wsurl') || environment.wsurl;
  contact = localStorage.getItem('contact') || '55516321';
  currentPaymentProvider = EPaymentProvider.mmoney;
  machineId = {} as IMachineId;

  clientId = {} as IClientId;

  wsAlive = {} as IAlive;

  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();
  test = { test: false };
  static __T: any;
  static waiting_T: any
  audio = new Audio('assets/mixkit-female-says-thank-you-380.wav');
  _machineStatus = { status: {} as IMachineStatus } as any;
  constructor(
    public controlMenuService: ControlMenuService,



    public http: HttpClient,
    public wsapi: WsapiService,
    public toast: ToastController,
    public modal: ModalController,
    // public notifyService: NotifierService,
    public storage: IonicStorageService,

    public load: LoadingController,
    public alert: AlertController) {
    this.wsapi = wsapi;
    // this.zone.runOutsideAngular(() => {
    this.machineId.machineId = localStorage.getItem('machineId') || '12345678';
    this.machineId.otp = localStorage.getItem('otp') || '111111';
    this.wsapi.connect(this.wsurl, this.machineId.machineId, this.machineId.otp);


    this.wsapi.aliveSubscription.subscribe(r => {
      console.log('ALIVE', r);

      try {
        if (!r) return console.log('empty');
        console.log('ws alive subscription', r);
        
        this.cash = r.balance;
        this.wsAlive.time = new Date();
        this.wsAlive.isAlive = this.checkOnlineStatus();
        this.test.test = r?.test;
        // if (!this.vendingOnSale.length) {
        //   setTimeout(() => {
        //     window.location.reload();
        //   }, 3000);
        //   this.validateDB();
        // }
        if (r.balance)
          this.cash = r.balance;

        this._machineStatus.status = r.data.mstatus;
        this._machineStatus.status.temp = hex2dec(this._machineStatus.status.temp)
      } catch (error) {
        console.log('error', error);

      }

    });

    this.wsapi.refreshSubscription.subscribe(r => {
      if (r) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    });
    this.wsapi.billProcessSubscription.subscribe(r => {
      if (!r) return console.log('empty');
      console.log('ws process subscription', r);
      const message = 'processing slot ' + r.position + `==>${r.position}` + '; ' + r?.bill?.vendingsales?.find(v => v.position == r.position)?.stock?.name;


      // const x = this.vendingOnSale?.find(v => r?.bill?.vendingsales.find(vx => vx.stock.id == v.stock.id && r.position.position + '' == vx.position + ''));
      const x = this.vendingOnSale.find(v => v.position == r.position);
      console.log('X', x, r.position, x && r.position);

      if (x && r.position) {
        this.deductOrderUpdate(x.position);
        x.stock.qtty--;


        // this.clearWaitingT();

        // PLAY SOUNDS
        this.audio = new Audio('assets/mixkit-female-says-thank-you-380.wav');
        this.audio.play();
        this.toast.create({ message, duration: 2000 }).then(r => {
          r.present();
        });

        r.bill.updatedAt = new Date();



      } else if (!r.position) {
        // PLAY SOUNDS
        this.audio = new Audio('assets/labob.mp3');
        this.audio.play();
        this.alert.create({
          header: 'Alert', message, buttons: [
            {
              text: 'OK',
              role: 'confirm',
              handler: () => {
              },
            },
          ]
        }).then(v => v.present());
      }
      // this.loadDeliveryingBills().subscribe(r=>{
      //   this.dismissModal();
      //   this.dismissLoading();
      //     if (r.status) {
      //       const pb = r.data as Array<IBillProcess>;
      //       if(pb.length)
      //       this.showModal(RemainingbillsPage, { r:pb }).then(r=>{
      //         r.present();
      //       });
      //     }
      //     else {
      //       this.toast.create({ message: r.message, duration: 5000 }).then(r => {
      //         r.present();
      //       })
      //     }
      // })
      // this.dismissModal();
      console.log(`vendingOnSale-->`, this.vendingOnSale);
      this.storage.set('saleStock', this.vendingOnSale, 'stock');

      // });
    });
    this.wsapi.waitingDelivery.subscribe(r => {
      console.log('WAITING FOR DELIVERY');
      // available bills

      if (r) {
        this.dismissModal();
        this.dismissModal();
        this.dismissLoading();
        this.loadDeliveryingBills().subscribe(r => {
          if (r.status) {
            this.dismissModal();
            const pb = r.data as Array<IBillProcess>;
            if (pb.length)
              this.showModal(RemainingbillsPage, { r: pb }).then(r => {
                r.present();
              });
          }
          else {
            this.toast.create({ message: r.message, duration: 5000 }).then(r => {
              r.present();
            })
          }
        })
        // this.showModal(RemainingbillsPage, { r });
      }
    })

    // this.initLocalHowToVideoPlayList();
  }

  // private initLocalHowToVideoPlayList() {

  //   for(let i = 0; i < this.howtoVideoPlayList.length; i++) {
  //     fetch(this.howtoVideoPlayList[i].video).then(r => r.blob()).then(blob => {
  //       this.howtoVideoPlayList[i].file = blob;
  //     });
  //   }
  //   // console.log(this.howtoVideoPlayList[1]);

  // }

  public validateDB() {

  }
  public onDeductOrderUpdate(cb: (position: number) => void) {
    this.eventEmitter.on('deductOrderUpdate', cb);
  }
  public deductOrderUpdate(position: number) {

    this.eventEmitter.emit('deductOrderUpdate', position);
  }
  public checkOnlineStatus() {
    if (this.wsAlive) {
      return (moment().get('milliseconds') - moment(this.wsAlive.time).get('milliseconds')) < 10 * 1000;
    } else {
      return false;
    }
  }
  public dismissModal(data: any = null) {
    this.modal.getTop().then(r => {
      r ? this.modal.dismiss({ data }) : null
    })
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
    return (await this.storage.get2(id + '', db));
  }

  newProductItems(s: Array<IVendingMachineSale>) {
    this.stock.length = 0;
    s.map(vs => vs.stock).forEach(v => {
      console.log('stock', v);

      if (!this.stock.find(y => y.id == v.id))
        this.stock.push(JSON.parse(JSON.stringify(v)));
    });
    console.log(`new stock`, this.stock);
    this.storage.set('productItems', this.stock, 'item')
  }

  updateStockItems(s: Array<IStock>) {
    s.forEach(v => {
      // console.log('stock',v);

      if (!this.stock.find(y => y.id == v.id))
        this.stock.push(JSON.parse(JSON.stringify(v)));
    });
    this.storage.set('productItems', this.stock, 'item')
  }

  async showModal(component: any, d: any = {}) {
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
      return await this.modal.create({ component, componentProps: d, cssClass: 'dialog-fullscreen' });
    } catch (error) {
      console.log('ERROR', error);
      this.toast.create({ message: 'Error', duration: 2000 }).then(r => {
        r.present();
      });
    }

  }
  closeModal(data: any = null) {
    this.modal.getTop().then(r => {
      r ? r.dismiss(data) : null;
    })
  }
  initDemo() {
    return this.http.get<IResModel>(this.url + '/init?machineId=' + this.machineId.machineId, { headers: this.headerBase() });
  }
  loadVendingSale(isActive = 'yes') {
    const req = {} as IReqModel;
    req.command = EClientCommand.list;
    req.data = {
      clientId: this.clientId.clientId
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    console.log(`req der`, req);
    return this.http.post<IResModel>(this.url + '/machineSaleList?isActive=' + isActive, req, { headers: this.headerBase() });
  }

  loadOnlineMachine() {
    return this.http.get<IResModel>(this.url + '/getOnlineMachines', { headers: this.headerBase() });
  }
  loadDeliveryingBills() {
    return this.http.post<IResModel>(this.url + '/getDeliveryingBills', { token: cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex) }, { headers: this.headerBase() });
  }
  saveSale(data: any) {

    return this.http.post<IResModel>(this.url + '/saveMachineSale', { data, token: cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex) }, { headers: this.headerBase() });
  }
  recoverSale() {
    return this.http.post<IResModel>(this.url + '/readMachineSale', { token: cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex) }, { headers: this.headerBase() });
  }
  loadPaidBills() {
    return this.http.post<IResModel>(this.url + '/getPaidBills', { headers: this.headerBase() });
  }
  loadBills() {
    return this.http.post<IResModel>(this.url + '/getBills', { headers: this.headerBase() });
  }
  retryProcessBill(T: string, position: number) {
    return this.http.post<IResModel>(this.url + '/retryProcessBill?T=' + T + '&position=' + position, { token: cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex) }, { headers: this.headerBase() });
  }
  retryProcessBillLocal(T: string, position: number) {
    const p = { data: { slot: position }, transactionID: T }
    return this.http.post<IResModel>('http://localhost:19006/', p, { headers: this.headerBase() });
  }


  buyMMoney(ids: Array<IVendingMachineSale>, value: number, machineId: string) {
    this.currentPaymentProvider = EPaymentProvider.mmoney;
    const req = {} as IReqModel;
    req.command = EClientCommand.buyMMoney;
    req.data = {
      ids,
      value,
      clientId: this.clientId.clientId
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    return this.http.post<IResModel>(this.url, req, { headers: this.headerBase() });
  }

  getFreeProduct(position: number, id: number) {
    this.currentPaymentProvider = EPaymentProvider.mmoney;
    const req = {} as IReqModel;
    req.data = {
      position,
      clientId: this.clientId.clientId,
      id
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    return this.http.post<IResModel>(this.url + '/getFreeProduct', req, { headers: this.headerBase() });
  }
  showLoading(message = 'loading...', t = 15000) {
    return new Promise((resolve, reject) => {
      this.load.create({ message, duration: t }).then(r => {
        r.present();
        resolve(null);
      });
    });
  }
  dismissLoading() {
    return new Promise((resolve, reject) => {
      this.load.getTop().then(v => {
        v ? this.load.dismiss() : null;
        resolve(null);
      });
    })

  }






  audioElement: HTMLAudioElement = {} as any;
  simpleMessage(text: string, time: number = 2000) {
    this.toast.create({ message: text, duration: time }).then(r => r.present());
  }


  openSoundPleaseSelect(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.audioElement.src = '../../assets/machine_sound/please_select.mp3';
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  openSoundPleaseInsertBanknotes(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.audioElement.src = '../../assets/machine_sound/please_insert_banknotes.mp3';
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  openSoundComplete(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.audioElement.src = '../../assets/machine_sound/complete.mp3';
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  openSoundSystemError(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.audioElement.src = '../../assets/machine_sound/system_error.mp3';
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  openSoundThankYour(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.audioElement.src = '../../assets/machine_sound/thank_you.mp3';
        this.audioElement.play();

        resolve(IENMessage.success);
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  openSoundReady(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        this.audioElement.src = '../../assets/machine_sound/ready.mp3';
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
        reader.addEventListener('load', event => {
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
          responseType: 'blob'
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
}

