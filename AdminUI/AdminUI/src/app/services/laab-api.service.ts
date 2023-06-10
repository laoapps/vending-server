import { Injectable } from '@angular/core';
import { LAAB_FindMachineCoinLimiter, LAAB_FindMachineCoinWallet, LAAB_FindMachineLimiter, LAAB_FindMachineWallet, LAAB_FindMerchantAccount, LAAB_FindMerchantCoinAccount, LAAB_FindMyVendingLimiterAccount, LAAB_FindVendingCoin, LAAB_FindVendingLimiterCoinAccount, LAAB_Genpasskeys, LAAB_Login, LAAB_RegisterMachineCoinLimiter, LAAB_RegisterMachineCoinWallet, LAAB_RegisterMachineLimiter, LAAB_RegisterMachineWallet, LAAB_RegisterMerchantAccount, LAAB_RegisterMerchantCoinAccount, LAAB_RegisterVendingLimiterCoinAccount, LAAB_ShowMachineCoinLimiterBalance, LAAB_ShowMachineCoinLimiterByGroup, LAAB_ShowMachineCoinWalletBalance, LAAB_ShowMachineCoinWalletByGroup, LAAB_ShowMachineLimiterBalance, LAAB_ShowMachineWalletBalance, LAAB_ShowMerchantBalance, LAAB_ShowMerchantCoinBalance, LAAB_ShowVendingLimiterCoinBalance } from '../models/laab.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LaabApiService {

  private url: string = environment.testVending;
  private laaburl: string = environment.laaburl;

  constructor(
    private http: HttpClient
  ) { }

  //  merchant
  login(params: LAAB_Login): Observable<any> {
    return this.http.post(this.laaburl + 'user/login', params);
  }
  findMerchantAccount(params: LAAB_FindMerchantAccount): Observable<any> {
    return this.http.post(this.url + 'merchant/find_my_merchant', params);
  }
  registerMerchantAccount(params: LAAB_RegisterMerchantAccount): Observable<any> {
    return this.http.post(this.url + 'merchant/register', params);
  }
  findVendingCoin(params: LAAB_FindVendingCoin): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/search_currency_list_page', params);
  }
  findMerchantCoinAccount(params: LAAB_FindMerchantCoinAccount): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_my_coin_wallet', params);
  }
  registerMerchantCoinAccount(params: LAAB_RegisterMerchantCoinAccount): Observable<any> {
    return this.http.post(this.url + 'pex/exchange_service/coin_register', params);
  }
  showMerchantCoinBalance(params: LAAB_ShowMerchantCoinBalance): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_to_coin_balance', params);
  }
  coinTransfer(params: LAAB_ShowMerchantCoinBalance): Observable<any> {
    return this.http.post(this.url + 'merchant/expend', params);
  }
  findVendingLimiterAccount(params: LAAB_FindMyVendingLimiterAccount): Observable<any> {
    return this.http.post(this.url + 'merchant/find_my_vending_limiter', params);
  }
  registerVendingLimiterAccount(params: LAAB_FindMyVendingLimiterAccount): Observable<any> {
    return this.http.post(this.url + 'merchant/create_vending_limiter', params);
  }
  findVendingLimiterCoinAccount(params: LAAB_FindVendingLimiterCoinAccount): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_my_coin_wallet', params);
  }
  showMVendingLimiterCoinBalance(params: LAAB_ShowMerchantCoinBalance): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_to_coin_balance', params);
  }
  registerVendingLimiterCoinAccount(params: LAAB_RegisterVendingLimiterCoinAccount): Observable<any> {
    return this.http.post(this.url + 'pex/exchange_service/coin_register', params);
  }
  showVendingLimiterCoinBalance(params: LAAB_ShowVendingLimiterCoinBalance): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_to_coin_balance', params);
  }










  // vending wallet
  findMachineWallet(params: LAAB_FindMachineWallet): Observable<any> {
    return this.http.post(this.url + 'merchant/find_my_vending_wallet', params);
  }
  registerMachineWallet(params: LAAB_RegisterMachineWallet): Observable<any> {
    return this.http.post(this.url + 'merchant/create_vending_wallet', params);
  }
  showMachineWalletBalance(params: LAAB_ShowMachineWalletBalance): Observable<any> {
    return this.http.post(this.url + 'merchant/show_vending_wallet_balance', params);
  }
  findMachineCoinWallet(params: LAAB_FindMachineCoinWallet): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_my_coin_wallet', params);
  }
  registerMachineCoinWallet(params: LAAB_RegisterMachineCoinWallet): Observable<any> {
    return this.http.post(this.url + 'pex/exchange_service/coin_register', params);
  }
  showMachineCoinWalletBalance(params: LAAB_ShowMachineCoinWalletBalance): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_to_coin_balance', params);
  }
  showMachineCoinWalletByGroup(params: LAAB_ShowMachineCoinWalletByGroup): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_currency_list_all', params);
  }


  // vending limiter
  findMachineLimiter(params: LAAB_FindMachineLimiter): Observable<any> {
    return this.http.post(this.url + 'merchant/find_my_vending_limiter', params);
  }
  registerMachineLimiter(params: LAAB_RegisterMachineLimiter): Observable<any> {
    return this.http.post(this.url + 'merchant/create_vending_limiter', params);
  }
  showMachineLimiterBalance(params: LAAB_ShowMachineLimiterBalance): Observable<any> {
    return this.http.post(this.url + 'merchant/show_vending_limiter_balance', params);
  }
  findMachineCoinLimiter(params: LAAB_FindMachineCoinLimiter): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_my_coin_wallet', params);
  }
  registerMachineCoinLimiter(params: LAAB_RegisterMachineCoinLimiter): Observable<any> {
    return this.http.post(this.url + 'pex/exchange_service/coin_register', params);
  }
  showMachineCoinLimiterBalance(params: LAAB_ShowMachineCoinLimiterBalance): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_to_coin_balance', params);
  }
  showMachineCoinLimiterByGroup(params: LAAB_ShowMachineCoinLimiterByGroup): Observable<any> {
    return this.http.post(this.url + 'pex/coin_currency/show_sender_coin_currency_list_all', params);
  }
}
