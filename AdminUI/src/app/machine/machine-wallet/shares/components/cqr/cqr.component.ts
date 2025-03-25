import { Component, Input, OnInit } from '@angular/core';
import { ICurrentCard, IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { GenerateCqrPage } from '../generate-cqr/generate-cqr.page';
@Component({
  selector: 'app-cqr',
  templateUrl: './cqr.component.html',
  styleUrls: ['./cqr.component.scss'],
})
export class CqrComponent implements OnInit {

  moneyList: Array<number> = [1000,2000,5000,10000,20000,50000,100000,200000,500000,1000000, 2000000, 5000000];
  
  private destination: string;
  private name: string;
  amount: number = 0;

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.destination = this.apiService.currentVendingWalletUUID;
    this.name = this.apiService.currentVendingWalletCoinName;
  }



  chooseMoney(amount: number) {
    this.amount = amount;
    
  }

  generate(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        if (!(this.amount)) throw new Error(IENMessage.pleaseLimitAmount);
        const params = {
          type: 'CQR',
          mode: 'COIN',
          destination: this.destination,
          amount: this.amount,
          options: {
            coinname: this.apiService.ownerCoinName,
            name: this.name,
          }
        }
        console.log(`params`, params);
        this.apiService.modal.create({ component: GenerateCqrPage, componentProps: { detail: params } }).then(r =>{
          r.present();
        });
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
}
