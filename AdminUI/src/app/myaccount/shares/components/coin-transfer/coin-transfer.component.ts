import { Component, OnInit } from '@angular/core';
import { ICurrentCard, IENMessage } from 'src/app/models/base.model';
import { MerchantCoinTransferProcess } from 'src/app/myaccount/processes/merchantCoinTransfer.process';
import { VendingLimiterCoinTransferProcess } from 'src/app/myaccount/processes/vendingLimiterCoinTransfer.process';
import { ApiService } from 'src/app/services/api.service';
import { LaabApiService } from 'src/app/services/laab-api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { CoinTransferBillPage } from '../coin-transfer-bill/coin-transfer-bill.page';

@Component({
  selector: 'app-coin-transfer',
  templateUrl: './coin-transfer.component.html',
  styleUrls: ['./coin-transfer.component.scss'],
})
export class CoinTransferComponent implements OnInit {

  merchantCoinTransferProcess: MerchantCoinTransferProcess;
  vendingLimiterCoinTransferProcess: VendingLimiterCoinTransferProcess;

  moneyList: Array<number> = [1000,2000,5000,10000,20000,50000,100000,200000,500000,1000000, 2000000, 5000000];
  
  currentCard: string;
  phonenumber: string;
  amount: number = 0;
  description: string;


  constructor(
    public apiService: ApiService,
    private laabAPIService: LaabApiService,
    private vendingAPIService: VendingAPIService
  ) { 
    this.merchantCoinTransferProcess = new MerchantCoinTransferProcess(this.apiService, this.vendingAPIService);
    this.vendingLimiterCoinTransferProcess = new VendingLimiterCoinTransferProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
    this.currentCard = this.apiService.currentcard;
    console.log(`==>`, this.currentCard);
  }

  chooseMoney(amount: number) {
    this.amount = amount;
  }

  transfer(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (!(this.phonenumber && this.amount && this.description)) throw new Error(IENMessage.parametersEmpty);

        if (this.currentCard == ICurrentCard.merchantCoinCard) {
          if (this.apiService.merchanteCoinBalance < this.amount) throw new Error(IENMessage.yourBalanceIsNotEnought);

          const params = {
            ownerUuid: this.apiService.ownerUuid,
            sender: this.apiService.merchantUUID,
            receiver: '+85620' + this.phonenumber,
            amount: this.amount,
            description: this.description,
            limitBlock: 10
          }
          console.log(`params`, params);

          const run = await this.merchantCoinTransferProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run);

          this.apiService.merchanteCoinBalance = this.apiService.merchanteCoinBalance - this.amount;

          this.apiService.modal.create({ component: CoinTransferBillPage, componentProps: { myBill: run.data[0].myBill } }).then(r => {
            r.present();
            r.onDidDismiss().then(() => resolve(IENMessage.success));
          });

        } else if (this.currentCard == ICurrentCard.vendingLimtierCoinCard) {
          if (this.apiService.vendingLimiterCoinBalance < this.amount) throw new Error(IENMessage.yourBalanceIsNotEnought);

          const params = {
            ownerUuid: this.apiService.ownerUuid,
            sender: this.apiService.vendingLimiterUUID,
            receiver: '+85620' + this.phonenumber,
            amount: this.amount,
            description: this.description,
            limitBlock: 10
          }

          const run = await this.vendingLimiterCoinTransferProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run);

          this.apiService.vendingLimiterCoinBalance = this.apiService.vendingLimiterCoinBalance - this.amount;

          this.apiService.modal.create({ component: CoinTransferBillPage, componentProps: { myBill: run.data[0].myBill } }).then(r => {
            r.present();
            r.onDidDismiss().then(() => resolve(IENMessage.success));
          });
          
        } else {
          throw new Error(IENMessage.youHaveNoCardUsingNow);
        }

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

}
