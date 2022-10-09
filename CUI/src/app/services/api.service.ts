import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EClientCommand, EPaymentProvider, IMachineId, IReqModel, IResModel } from './syste.model';
import { WsapiService } from './wsapi.service';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = 'http://laoapps.com:9009';
  wsurl = 'ws://laoapps.com:9009';
  currentPaymentProvider=EPaymentProvider.laab;
  machineId={} as IMachineId;
  constructor(public http:HttpClient,public wsapi:WsapiService) { 
    this.machineId.machineId='12345678';
    this.machineId.otp = '111111';
    this.wsapi.connect(this.wsurl,this.machineId.machineId,this.machineId.otp);
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
    return this.http.post<IResModel>(this.url,{},{headers:this.headerBase()});
  }
  
  buyMMoney(ids:Array<number>,value:number,machineId:string){
    this.currentPaymentProvider = EPaymentProvider.mmoney;
    const req = {} as IReqModel;
    req.command = EClientCommand.buyMMoney;
    req.data={
      ids,
      value,
      machineId
    };
    req.ip;
    req.time = new Date().toString();
    req.token;
    return this.http.post<IResModel>(this.url,req,{headers:this.headerBase()});
  }

}
