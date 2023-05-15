import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EClientCommand, EPaymentProvider, IAlive, IBillProcess, IClientId, IMachineClientID, IMachineId, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale } from './syste.model';
import { WsapiService } from './wsapi.service';
import * as cryptojs from 'crypto-js';
import { environment } from 'src/environments/environment';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
// import { NotifierService } from 'angular-notifier';
import moment from 'moment';
import * as uuid from 'uuid';
import { IonicStorageService } from '../ionic-storage.service';
import { EventEmitter } from 'events';
import { RemainingbillsPage } from '../remainingbills/remainingbills.page';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  _billEvents = new EventEmitter();
  stock = new Array<IStock>();
  eventEmitter = new EventEmitter();
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
  audio = new Audio('assets/khopchay.mp3');

  constructor(public http: HttpClient,
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
      if (!r) return console.log('empty');
      console.log('ws alive subscription', r);
      this.wsAlive.time = new Date();
      this.wsAlive.isAlive = this.checkOnlineStatus();
      this.test.test = r?.test;
      // if (!this.vendingOnSale.length) {
      //   setTimeout(() => {
      //     window.location.reload();
      //   }, 3000);
      //   this.validateDB();
      // }

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
        this.audio = new Audio('assets/khopchay.mp3');
        this.audio.play();
        this.toast.create({ message, duration: 2000 }).then(r => {
          r.present();
        });

        r.bill.updatedAt = new Date();

        this.loadDeliveryingBills().subscribe(r => {
          if (r.status) {
            this.dismissModal();
            const pb = r.data as Array<IBillProcess>;
            if(pb.length)
            this.showModal(RemainingbillsPage, { r:pb });
          }
          else {
            this.toast.create({ message: r.message, duration: 5000 }).then(r => {
              r.present();
            })
          }
        })

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
      this.dismissModal();
      this.storage.set('saleStock', this.vendingOnSale, 'stock');

      // });
    });
    this.wsapi.waitingDelivery.subscribe(r => {
      console.log('WAITING FOR DELIVERY');
      // available bills

      if (r) {
        this.dismissModal();
        this.dismissLoading();
        this.showModal(RemainingbillsPage, { r });
      }
    })


  }

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
    console.log(this.wsAlive.time);

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
  newStockItems(s: Array<IVendingMachineSale>) {
    this.stock.length=0;
    s.map(vs => vs.stock).forEach(v => {
      // console.log('stock',v);

      if (!this.stock.find(y => y.id == v.id))
        this.stock.push(JSON.parse(JSON.stringify(v)));
    });
    this.storage.set('stockitems_', this.stock, 'item')
  }

  updateStockItems(s: Array<IStock>) {
    s.forEach(v => {
      // console.log('stock',v);

      if (!this.stock.find(y => y.id == v.id))
        this.stock.push(JSON.parse(JSON.stringify(v)));
    });
    this.storage.set('stockitems_', this.stock, 'item')
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
      this.toast.create({ message: 'Error' }).then(r => {
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
  loadVendingSale() {
    const req = {} as IReqModel;
    req.command = EClientCommand.list;
    req.data = {
      clientId: this.clientId.clientId
    };
    req.ip;
    req.time = new Date().toString();
    req.token = cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    return this.http.post<IResModel>(this.url, req, { headers: this.headerBase() });
  }

  loadOnlineMachine() {
    return this.http.get<IResModel>(this.url + '/getOnlineMachines', { headers: this.headerBase() });
  }
  loadDeliveryingBills() {
    return this.http.post<IResModel>(this.url + '/getDeliveryingBills', { headers: this.headerBase() });
  }

  loadPaidBills() {
    return this.http.post<IResModel>(this.url + '/getPaidBills', { headers: this.headerBase() });
  }
  loadBills() {
    return this.http.post<IResModel>(this.url + '/getBills', { headers: this.headerBase() });
  }
  retryProcessBill(T: string,position:number) {
    return this.http.post<IResModel>(this.url + '/retryProcessBill?T=' + T+'&position='+position, { token: cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex) }, { headers: this.headerBase() });
  }
  // loadSaleList() {
  //   const req = {} as IReqModel;
  //   req.command = EClientCommand.list;
  //   req.data = { clientId: this.clientId.clientId };
  //   return this.http.post<IResModel>(this.url, req, { headers: this.headerBase() });
  // }

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
  showLoading(message = 'loading...') {
    this.load.create({ message, duration: 15000 }).then(r => {
      r.present();
    });
  }
  dismissLoading() {
    this.load.getTop().then(v => {
      v ? this.load.dismiss() : null
    })
  }
}
