import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { VENDING_CashValidation, VENDING_CashinValidation, VENDING_CreateEPIN, VENDING_CreateSMC, VENDING_LoadSMC, VENDING_MMoneyCashoutValidation, VENDING_PaidValidation, VENDING_ShowVendingWalletCoinBalance, VENDING_TransferValidation } from '../models/vending.model';

@Injectable({
  providedIn: 'root'
})
export class VendingAPIService {

  private url: string = environment.vending_server;

  constructor(
    private http: HttpClient
  ) { }

  showVendingWalletCoinBalance(params: VENDING_ShowVendingWalletCoinBalance): Observable<any> {
    return this.http.post(this.url + '/laab/client/show_vending_wallet_coin_balance', params);
  }
  cashValidation(params: VENDING_CashValidation): Observable<any> {
    return this.http.post(this.url + '/laab/client/cash_validation', params);
  }
  cashinValidation(params: VENDING_CashinValidation): Observable<any> {
    return this.http.post(this.url + '/laab/client/cash_in_validation', params);
  }
  paidValidation(params: VENDING_PaidValidation): Observable<any> {
    return this.http.post(this.url + '/laab/client/paid_validation', params);
  }
  createSMC(params: VENDING_CreateSMC): Observable<any> {
    return this.http.post(this.url + '/laab/client/create_smart_contract', params);
  }
  loadSMC(params: VENDING_LoadSMC): Observable<any> {
    return this.http.post(this.url + '/laab/client/load_smart_contract', params);
  }
  createEPIN(params: VENDING_CreateEPIN): Observable<any> {
    return this.http.post(this.url + '/laab/client/create_epin', params);
  }
  transferValidation(params: VENDING_TransferValidation): Observable<any> {
    return this.http.post(this.url + '/laab/client/transfer_validation', params);
  }







  // MMoney
  mmoneyCashValidation(params: VENDING_MMoneyCashoutValidation): Observable<any> {
    return this.http.post(this.url + '/credit_mmoney', params);
  }
}
