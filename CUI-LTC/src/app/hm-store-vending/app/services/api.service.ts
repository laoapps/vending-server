
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import * as cryptojs from 'crypto-js';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  machineId: any;
  otp: any;
  token:any
  public url_onlineinventory = environment.server_inventory
  public url_onlinestore = environment.server_onlinestore
  public url_orderbiling = environment.server_orderbilling
  public url_notificaion = environment.server_notification
  public wallet_mmoney = environment.server_url
  constructor(private http: HttpClient) { }

  cat_selmany(): Observable<any> {
    const header = this.headerBase();
    return this.http.get(this.url_onlineinventory + 'gproducttype/selmany/', { headers: header });
  }

  loadpost_byproducttype(type: string): Observable<any> {
    const header = this.headerBase();
    return this.http.get(this.url_onlinestore + 'post_3apps/selmany_by_producttype/' + type, { headers: header });
  }

  loadseconproduct(param: any): Observable<any> {
    const header = this.headerBase();
    return this.http.post(this.url_onlineinventory + 'product/LoadManyProductByOwnerUuidAndUUIDs/', param, { headers: header });
  }

  selmany_store(param: any): Observable<any> {
    const header = this.headerBase();
    return this.http.post(this.url_onlinestore + 'gstore_3apps/selmany_bystoretype2/', param, { headers: header });
  }

  loadpost_bystoreuuid(data: any): Observable<any> {
    const header = this.headerBase();
    return this.http.post(this.url_onlinestore + 'post_3apps/selmany_bystoreuuid', data, { headers: header });
  }

  changeQuotationsToOrder(param: any): Observable<any> {
    const header = this.headerBase();
    return this.http.post(this.url_orderbiling + 'posquotation/changeQuotationsToOrder?vending=true', param, { headers: header });
  }


// ========================================================================

Genmmoneyqr_market(data,order,store): Observable<any> {   // use domain in gateway from getBaseUrl()
  const headers = this.headerBase();
  return this.http.post(this.wallet_mmoney+'laab/genmmoneyqr_market?order='+order+'&store='+store,data,{headers});
}

  // calcullate vat

  calculateVat(data): Observable<any> { // uuid: string
    const headers = this.headerBase();
    return this.http.post(this.url_notificaion+'/fbsubscription/calculateVat' ,data,{headers});
  }

  protected headerBase(): any {
    this.machineId = localStorage.getItem('machineId');
    this.otp = localStorage.getItem('otp');
    this.token = cryptojs.SHA256(this.machineId + this.otp).toString(cryptojs.enc.Hex);
    console.log('====================================');
    console.log('token',this.token);
    console.log('====================================');

    let skip = localStorage.getItem('skip')
    let skip_store = localStorage.getItem('skip_store')
    let skip_tag = localStorage.getItem('skip_tag')
    let vending = localStorage.getItem('vending')
    console.log('headerBase_vending',vending);
    
    if (skip == null) {
      skip = '0'
    }
    if (!vending) {
      vending = ''
    }
    if (skip_tag == null) {
      skip_tag = '0'
    }
    if (skip_store == null) {
      skip_store = '0'
    }

    // const authorization='dba123456';
    // .set('authorization',authorization+'');

    const myheader = new HttpHeaders({ 'Content-Type': 'application/json' }).set('Access-Control-Allow-Origin', '*')
      .set('token', this.token + '').set('skip', skip + '').set('skip_store', skip_store + '').set('skip_tag', skip_tag + '').set('vending', vending);
    return myheader;
  }
}
