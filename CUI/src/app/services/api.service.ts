import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EClientCommand, EPaymentProvider, IAlive, IClientId, IMachineClientID, IMachineId, IReqModel, IResModel, IVendingMachineBill, IVendingMachineSale } from './syste.model';
import { WsapiService } from './wsapi.service';
import * as cryptojs from 'crypto-js';
import { environment } from 'src/environments/environment';
import { ModalController, ToastController } from '@ionic/angular';
import { NotifierService } from 'angular-notifier';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = environment.url;
  wsurl = environment.wsurl;
  currentPaymentProvider=EPaymentProvider.laab;
  machineId={} as IMachineId;

  clientId = {} as IClientId;

  wsAlive={}as IAlive;

  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();
  constructor(public http:HttpClient,public wsapi:WsapiService,public toast:ToastController,public modal:ModalController,public notifyService:NotifierService) { 
    this.machineId.machineId='12345678';
    this.machineId.otp = '111111';
    
    this.wsapi.connect(this.wsurl,this.machineId.machineId,this.machineId.otp);

    this.wsapi.loginSubscription.subscribe(r=>{
      if(!r) return console.log('empty')
      console.log('ws login subscription',r);
   
        this.clientId.clientId = r.clientId;

    })
    this.wsapi.aliveSubscription.subscribe(r=>{
      if(!r) return console.log('empty');
      console.log('ws alive subscription',r);
      this.wsAlive.time=new Date();
    });
    this.wsapi.billProcessSubscription.subscribe(r=>{
      if(!r) return console.log('empty');
      console.log('ws process subscription',r);
      const message = 'processing slot '+r.position.position+`${r.position.status}`+' '+r?.bill?.vendingsales.find(v=>v.position==r.position)?.stock?.name;
      this.toast.create({message,duration:2000}).then(r=>{
        r.present();
        this.notifyService.show({message,type:'success'});
       this.dismissModal();
      })
    });
 
  }
  public dismissModal(){
    this.modal.getTop().then(r=>{
      r?this.modal.dismiss():null
    })
  }
  
  private headerBase(): any {
    const token = localStorage.getItem('token');
    //const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    var headers = new HttpHeaders();
    headers.append('Access-Control-Allow-Origin' , '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept','application/json');
    headers.append('content-type','application/json');
     //let options = new RequestOptions({ headers:headers})
    return headers;
  }
  initDemo(){
    return this.http.get<IResModel>(this.url+'/init?machineId='+this.machineId.machineId,{headers:this.headerBase()});
  }
  loadOnlineMachine(){
    return this.http.get<IResModel>(this.url+'/getOnlineMachines',{headers:this.headerBase()});
  }
  loadPaidBills(){
    return this.http.get<IResModel>(this.url+'/getPaidBills',{headers:this.headerBase()});
  }
  loadBills(){
    return this.http.get<IResModel>(this.url+'/getBills',{headers:this.headerBase()});
  }
  loadSaleList(){
    const req = {} as IReqModel;
    req.command = EClientCommand.list;
    return this.http.post<IResModel>(this.url,req,{headers:this.headerBase()});
  }
  
  buyMMoney(ids:Array<IVendingMachineSale>,value:number,machineId:string){
    this.currentPaymentProvider = EPaymentProvider.mmoney;
    const req = {} as IReqModel;
    req.command = EClientCommand.buyMMoney;
    req.data={
      ids,
      value,
      clientId:this.clientId.clientId
    };
    req.ip;
    req.time = new Date().toString();
    req.token =cryptojs.SHA256(this.machineId.machineId + this.machineId.otp).toString(cryptojs.enc.Hex);
    // req.data.clientId = this.clientId.clientId;
    return this.http.post<IResModel>(this.url,req,{headers:this.headerBase()});
  }

}
