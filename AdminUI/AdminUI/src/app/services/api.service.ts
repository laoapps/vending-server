import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EClientCommand, EPaymentProvider, IAlive, IBillProcess, IClientId, IMachineClientID, IMachineStatus, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale } from './syste.model';
import { WsapiService } from './wsapi.service';
import * as cryptojs from 'crypto-js';
import { environment } from 'src/environments/environment';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { NotifierService } from 'angular-notifier';
import * as moment from 'moment';
import * as uuid from 'uuid';
import { IonicStorageService } from './ionic-storage.service';
import { EventEmitter } from 'events';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  offsettz =420;
  dateformat='yy-MM-dd HH:mm:ss';
  passkeys: string;
  ownerUuid: string;
  name: string;

  ownerCoinListId: string;
  ownerCoinCode: string;
  ownerCoinName: string;

  merchantUUID: string;
  merchantCoinName: string;
  merchanteCoinBalance: number;

  vendingLimiterUUID: string;
  vendingLimiterCoinName: string;
  vendingLimiterCoinBalance: number;

  vendingWalletUUID: Array<{ machineId: string, uuid: string }> = [];
  vendingWalletCoinName: Array<{ machineId: string, uuid: string, balance: number }> = [];

  currentcard: string;
  currentMachineId: string;
  currentVendingWalletUUID: string;
  currentVendingWalletCoinName: string;
  currentVendingWalletCoinBalance: number;



  stock = new Array<IStock>();
  eventEmitter = new EventEmitter();
  machineuuid = uuid.v4()
  url = localStorage.getItem('url') || environment.url;
  wsurl = localStorage.getItem('wsurl') || environment.wsurl;
  currentPaymentProvider = EPaymentProvider.mmoney;
  machineId = {} as IMachineClientID;

  clientId = {} as IClientId;

  wsAlive = {} as IAlive;

  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();
  test = { test: false };

  // audio = new Audio('assets/khopchay.mp3');
  myMachineStatus=new Array<{machineId:string,mstatus:IMachineStatus}>();
  constructor(public http: HttpClient,
    public router: Router,
    public wsapi: WsapiService,
    public toast: ToastController,
    public modal: ModalController,
    public notifyService: NotifierService,
    public storage: IonicStorageService,

    public load: LoadingController,
    public alert: AlertController) {
    this.offsettz=new Date().getTimezoneOffset();
    this.wsapi = wsapi;
    // this.zone.runOutsideAngular(() => {
    this.machineId.machineId = localStorage.getItem('machineId') || '12345678';
    this.machineId.otp = localStorage.getItem('otp') || '111111';
    this.wsapi.connect(this.wsurl);


    this.wsapi.aliveSubscription.subscribe(r => {
      console.log('ALIVE',r);
      //{ command: "ping", production: this.production, balance: r,limiter,merchant,mymmachinebalance, mymlimiterbalance, setting ,mstatus,mymstatus,mymsetting,mymlimiter},
     
      try {
       
        if (!r) return console.log('empty');
        this.myMachineStatus.length=0;
        this.myMachineStatus.push(...r.data.mymstatus)
        // console.log('ws alive subscription', r);
        this.wsAlive.time = new Date();
        this.wsAlive.isAlive = this.checkOnlineStatus();
        this.test.test = r?.test;
        // if (!this.vendingOnSale.length) {
        //   setTimeout(() => {
        //     window.location.reload();
        //   }, 3000);
        //   this.validateDB();
        // }
        r.data.mymstatus.forEach(e => {
            e.mstatus.temp=this.hex2dec(e.mstatus.temp);
        });
      } catch (error) {
        console.log('error',error);
        
      }
     

    });
  
    this.wsapi.refreshSubscription.subscribe(r => {
      if (r) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    })

  }
  public   validateDB(){
      
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
  private headerBase() {
    // const token = localStorage.getItem('lva_token');
    // console.log(`headerBase`, token);
    //const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    var headers = new HttpHeaders();
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    // headers.append('authorization', token);
    console.log(`HHHH`, headers);
    //let options = new RequestOptions({ headers:headers})
    return headers;
  }
  createStockItems(s: Array<IVendingMachineSale>) {
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

  async showModal(component: any, d: any = {},cssClass='dialog-fullscreen') {
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
      return await this.modal.create({ component, componentProps: d ,cssClass});
    } catch (error) {
      console.log('ERROR', error);
      this.toast.create({ message: 'Error' }).then(r => {
        r.present();
      });
      return null;
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
  loadOnlineMachine() {
    return this.http.get<IResModel>(this.url + '/getOnlineMachines', { headers: this.headerBase() });
  }
  loadPaidBills() {
    return this.http.get<IResModel>(this.url + '/getPaidBills', { headers: this.headerBase() });
  }
  getBills() {
    return this.http.get<IResModel>(this.url + '/getBills', { headers: this.headerBase() });
  }


  
  super_listMachine() {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/super_listMachine', {token}, { headers: this.headerBase() });
  }
  refreshMachine(data: any){
      return this.http.post<IResModel>(this.url + '/refreshMachine', data, { headers: this.headerBase() });
    }
  
  listMachine(isActive='all') {
    const req = {
      ownerUuid: localStorage.getItem('lva_ownerUuid'),
      token: localStorage.getItem('lva_token'),
      isActive
    }
    return this.http.post<IResModel>(this.url + '/listMachine?isActive='+isActive, req, { headers: this.headerBase() });
  }
  disableMachine(isActive,id:number) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/disableMachine?id=${id}&isActive=${isActive?'yes':'no'}`, {token}, { headers: this.headerBase() });
  }
  updateMachine(o:IMachineClientID,id:number) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/updateMachine?id=${id}`,{token,data:o}, { headers: this.headerBase() });
  }
  updateMachineSetting(o:IMachineClientID,id:number) {
    const token = localStorage.getItem('lva_token');
    console.log('update setting',o);
    
    return this.http.post<IResModel>(this.url + `/updateMachineSetting?id=${id}`,{token,data:o}, { headers: this.headerBase() });
  }
  addMachine(o:IMachineClientID) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/addMachine',{data:o,token}, { headers: this.headerBase() });
  }
  reportStock() {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/reportStock',{token}, { headers: this.headerBase() });
  }
  listSaleByMachine(machineId:string,isActive='all') {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/listSaleByMachine?machineId=${machineId}&isActive=${isActive}`, {token,}, { headers: this.headerBase() });
  }
  cloneSale(data: any) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/cloneSale`, {machineId: data.machineId, cloneMachineId: data.cloneMachineId, token: token}, { headers: this.headerBase() });
  }
  listSale(isActive='all') {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/listSale?isActive='+isActive,{token}, { headers: this.headerBase() });
  }
  updateSale(o:IVendingMachineSale) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/updateSale',{data:o,token}, { headers: this.headerBase() });
  }
  addSale(o:IVendingMachineSale) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/addSale',{data:o,token}, { headers: this.headerBase() });
  }
  listProduct(isActive:string='all') {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + '/listProduct?isActive='+isActive, {token}, { headers: this.headerBase() });
  }
  disableProduct(isActive:boolean,id:number) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/disableProduct?isActive=${isActive?'yes':'no'}&id=${id}`, {token}, { headers: this.headerBase() });
  }
  deleteProduct(id:number) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/deleteProduct?&id=${id}`, {token}, { headers: this.headerBase() });
  }
  disableSale(isActive:boolean,id:number) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/disableSale?isActive=${isActive?'yes':'no'}&id=${id}`, {token}, { headers: this.headerBase() });
  }
  deleteSale(id:number) {
    const token = localStorage.getItem('lva_token');
    return this.http.post<IResModel>(this.url + `/deleteSale?id=${id}`, {token,data:id}, { headers: this.headerBase() });
  }
  addProduct(o:IStock) {
    console.log(o);

    const token = localStorage.getItem('lva_token');
    if (!o.name || !o.price) { alert('Body is empty');return null;}
    return this.http.post<IResModel>(this.url + '/addProduct',{data:o,token}, { headers: this.headerBase() });
  }
  readMachineSaleForAdmin(data: any) {
    return this.http.post<IResModel>(this.url + '/readMachineSaleForAdmin',data, { headers: this.headerBase() });
  }
  loadVendingMachineSaleBillReport(data: any) {
    return this.http.post(this.url + '/loadVendingMachineSaleBillReport',data, { headers: this.headerBase() });
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

  showImage(p:string){
    return p;
  }
  hex2dec(hex: string) {
    try {
        return parseInt(hex, 16);
    } catch (error) {
        return -1;
    }

}
  machineStatus(x:string):IMachineStatus{
    let y:any;
    let b = ''
    try {
      y= JSON.parse(x);
     b = y.b;
    } catch (error) {
      console.log('error',error);
      return {} as IMachineStatus;
    }
    // fafb52215400010000130000000000000000003030303030303030303013aaaaaaaaaaaaaa8d
    // fafb52
    // 21 //len
    // 54 // series
    const billStatus =b.substring(10,12);
    // 00 // bill acceptor
    const coinStatus=b.substring(12,14);
    // 01 // coin acceptor
   const cardStatus= b.substring(14,16);
    // 00 // card reader status
    const tempconrollerStatus= b.substring(16,18);
    // 00 // tem controller status
    const temp= b.substring(18,20);
    // 13 // temp
    const doorStatus= b.substring(20,22);
    // 00 // door 
    const billChangeValue= b.substring(22,30);
    // 00000000 // bill change
    const coinChangeValue=b.substring(30,38);
    // 00000000 // coin change
    const machineIMEI= b.substring(38,58);
    // 30303030303030303030
    const allMachineTemp= b.substring(58,74);
    // 13aaaaaaaaaaaaaa8d
    // // fafb header
    // // 52 command
    // // 01 length
    // // Communication number+ 
    // '00'//Bill acceptor status+ 
    // '00'//Coin acceptor status+ 
    // '00'// Card reader status+
    // '00'// Temperature controller status+ 
    // '00'// Temperature+ 
    // '00'// Door status+ 
    // '00 00 00 00'// Bill change(4 byte)+ 
    // '00 00 00 00'// Coin change(4 byte)+ 
    // '00 00 00 00 00 00 00 00 00 00'//Machine ID number (10 byte) + 
    // '00 00 00 00 00 00 00 00'// Machine temperature (8 byte, starts from the master machine. 0xaa Temperature has not been read yet) +
    // '00 00 00 00 00 00 00 00'//  Machine humidity (8 byte, start from master machine)
    return {lastUpdate:new Date(y.t),billStatus,coinStatus,cardStatus,tempconrollerStatus,temp,doorStatus,billChangeValue,coinChangeValue,machineIMEI,allMachineTemp}
  }






  simpleMessage(text: string) {
    this.toast.create({ message: text, duration: 2000 }).then(r => r.present());
  }

  public paginations(pages: number, totalPage: number) {
    let previous_page = pages - 1;
    let pageingtation: any[] = [];
    if (totalPage > 1) {
      if (pages == 1) {
        previous_page = 1;
      }
      if (totalPage < 7) {
        for (let index = 1; index < totalPage + 1; index++) {
          if (index == pages) {
            const page = { page: index, name: index, active: 1 }
            pageingtation.push(page);
          } else {
            const page = { page: index, name: index, active: 0 }
            pageingtation.push(page);
          }
        }
      } else if (totalPage > 5) {
        if (pages < 4) {
          for (let index = 1; index < 7; index++) {
            if (index == pages) {
              const page = { page: index, name: index, active: 1 }
              pageingtation.push(page);
            } else {
              const page = { page: index, name: index, active: 0 }
              pageingtation.push(page);
            }
          }
        } else if (totalPage - 3 > pages) {

          for (let index = pages - 3; index < pages + 3; index++) {

            if (index == pages) {
              const page = { page: index, name: index, active: 1 }
              pageingtation.push(page);
            } else {
              const page = { page: index, name: index, active: 0 }
              pageingtation.push(page);
            }
          }
        } else {
          const pages_let = (totalPage - pages) - 3;

          for (let index = (pages - 3) + pages_let; index < totalPage + 1; index++) {

            if (index == pages) {
              const page = { page: index, name: index, active: 1 }
              pageingtation.push(page);
            } else {
              const page = { page: index, name: index, active: 0 }
              pageingtation.push(page);
            }
          }
        }
      }
    }

    return pageingtation;
  }
  
  convertBlobToBase64(blob: Blob): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
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
}

