import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { LaabApiService } from '../services/laab-api.service';
import { ICurrentCard, IENMessage } from '../models/base.model';
import { LAAB_FindMerchantAccount, LAAB_FindMerchantCoinAccount, LAAB_RegisterMerchantAccount, LAAB_ShowMerchantBalance } from '../models/laab.model';
import { LoadDefaultProcess } from './processes/loadDefault.process';
import { VendingAPIService } from '../services/vending-api.service';
import { CqrScanPage } from './shares/components/cqr-scan/cqr-scan.page';

@Component({
  selector: 'app-myaccount',
  templateUrl: './myaccount.page.html',
  styleUrls: ['./myaccount.page.scss'],
})
export class MyaccountPage implements OnInit {


  private loadDefaultProcess: LoadDefaultProcess;
    

  merchantCoinbalance: number = 0;
  vendingLimiterCoinBalance: number = 0;
  initState: boolean = false;

  currentcard: string = ICurrentCard.merchantCoinCard;
  child_coinTransferComponent: boolean = false;
  child_CQRComponent: boolean = false;
  child_reportOptionsComponent: boolean = false;

  // myMerchant: boolean = false;
  // myMerchantCoin: boolean = false;

  // phonenumber: string;
  // token: string;

  constructor(
    public apiService: ApiService,
    private laabAPIService: LaabApiService,
    private vendingAPIService: VendingAPIService
  ) {
    
    this.loadDefaultProcess = new LoadDefaultProcess(this.apiService, this.vendingAPIService);
  }


  async ngOnInit() {
    await this.loadDefault();
  }
  close() {
    this.apiService.currentcard = '';
    this.apiService.closeModal()
  }

  loadDefault(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        this.apiService.currentcard = this.currentcard;


        let params: any = {
          ownerUuid: this.apiService.ownerUuid,
        }

        const run = await this.loadDefaultProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.merchantCoinbalance = run.data[0].merchantCoinBalance;
        this.vendingLimiterCoinBalance = run.data[0].vendingLimiterCoinBalance;
        this.initState = true;

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.apiService.closeModal();
        resolve(error.message);
      }
    });
  }

  switchCard(card: string): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        if (card == this.apiService.currentcard) return resolve(IENMessage.success);

        let loading = this.apiService.load.create({ message: 'loading...' });
        (await loading).present();
        setTimeout(async () => {
          (await loading).dismiss();
          this.apiService.currentcard = card;
          this.currentcard = card;
          this.child_coinTransferComponent = false;
          this.child_CQRComponent = false;
          this.child_reportOptionsComponent = false;

          resolve(IENMessage.success);

        }, 100);

      } catch (error) {
       resolve(error.message); 
      }
    });
  }

  switchMenu(component: string,card:string): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        await this.switchCard(card);
        let loading = this.apiService.load.create({ message: 'loading...' });
        (await loading).present();
        setTimeout(async () => {
          (await loading).dismiss();

                  
          if (component == 'coin-transfer') {
            this.child_coinTransferComponent = true;
            this.child_CQRComponent = false;
            this.child_reportOptionsComponent = false;
          } else if (component == 'cmcqr') {
            this.child_coinTransferComponent = false;
            this.child_CQRComponent = true;
            this.child_reportOptionsComponent = false;
          } else if (component == 'cqr-scan') {
            this.apiService.modal.create({ component: CqrScanPage, componentProps: {} }).then(r => r.present());
          } else if (component == 'report-options') {
            this.child_coinTransferComponent = false;
            this.child_CQRComponent = false;
            this.child_reportOptionsComponent = true;
          }

          resolve(IENMessage.success);

        }, 100);

      } catch (error) {
       resolve(error.message); 
      }
    });
  }











  substringid() {
    return '*** *** *** ' + this.apiService.ownerUuid.substring(this.apiService.ownerUuid.length - 3, this.apiService.ownerUuid.length);
  }
  
}
