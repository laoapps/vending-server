import { Component, OnInit ,Input} from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingWalletCoinBalanceProcess } from '../../processes/loadVendingWalletCoinBalance.process';
@Component({
  selector: 'app-laab-cashin-show-code',
  templateUrl: './laab-cashin-show-code.page.html',
  styleUrls: ['./laab-cashin-show-code.page.scss'],
})
export class LaabCashinShowCodePage implements OnInit {

  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;


  @Input() qrImage: string;
  @Input() code: string;
  
  currentCash: number = 0;
  timeCheck: number = 0;
  timeClose: number = 0;

  constructor(
    private apiService: ApiService
  ) { 

  }

  ngOnInit() {
    this.loadQR();
    this.initTime();
  }

  loadQR() {
      (document.querySelector('#qr-img') as HTMLImageElement).src = this.qrImage;
  }

  close() {
    this.apiService.modal.dismiss();
  }

  balanceRefresh(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        this.currentCash = this.apiService.cash;

        let count = 0;
        let i = setInterval(async () => {
          count++;
          if (count == 5) {
            count = 0;

            // const run = await 
          }
        }, 1000);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    })
  }

  initTime() {
    this.timeClose = 0;
    
    let count: number = 60;
    let i = setInterval(() => {
      count--;
      if (count == 0) {
        clearInterval(i);
        this.apiService.simpleMessage(IENMessage.timeupPleaseGenerateAgain);
        this.apiService.modal.dismiss();
      }
      this.timeClose = count;

    }, 1000);
  }

}
