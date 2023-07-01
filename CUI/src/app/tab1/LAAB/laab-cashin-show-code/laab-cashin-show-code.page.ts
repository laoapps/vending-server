import { Component, OnInit ,Input, OnDestroy} from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingWalletCoinBalanceProcess } from '../../LAAB_processes/loadVendingWalletCoinBalance.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
@Component({
  selector: 'app-laab-cashin-show-code',
  templateUrl: './laab-cashin-show-code.page.html',
  styleUrls: ['./laab-cashin-show-code.page.scss'],
})
export class LaabCashinShowCodePage implements OnInit,OnDestroy {

  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;


  @Input() qrImage: string;
  @Input() code: string;
  
  currentCash: number = 0;
  timeClose: number = 0;
  counterRefreshBalance: any = {} as any;
  counterTimeClose: any = {} as any;

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService
  ) { 
    this.loadVendingWalletCoinBalanceProcess = new LoadVendingWalletCoinBalanceProcess(this.apiService, this.vendingAPIService);
  }

  async ngOnInit() {
    this.loadQR();
    this.initTime();
    await this.balanceRefresh();
  }
  ngOnDestroy(): void {
    clearInterval(this.counterRefreshBalance);
    clearInterval(this.counterTimeClose);
  }

  loadQR() {
      (document.querySelector('#qr-img') as HTMLImageElement).src = this.qrImage;
  }

  close() {
    clearInterval(this.counterRefreshBalance);
    clearInterval(this.counterTimeClose);
    this.apiService.modal.dismiss();
  }

  initTime() {
    this.timeClose = 60;
    
    let count: number = 60;
    this.counterTimeClose = setInterval(() => {
      count--;
      if (count == 0) {
        clearInterval(this.counterTimeClose);
        this.apiService.simpleMessage(IENMessage.timeupPleaseGenerateAgain);
        this.apiService.modal.dismiss();
      }
      this.timeClose = count;

    }, 1000);
  }
  
  balanceRefresh(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        this.currentCash = this.apiService.cash;

        let count = 0;
        const params = {
          machineId: localStorage.getItem('machineId')
        }
        this.counterRefreshBalance = setInterval(async () => {
          count++;
          if (count == 5) {
            const run = await this.loadVendingWalletCoinBalanceProcess.Init(params);
            if (run.message != IENMessage.success) throw new Error(run);
            console.log(`response`, run);
            this.apiService.cash = run.data[0].vendingWalletCoinBalance;
            console.log(`current cash`, this.currentCash, `cash`, this.apiService.cash);
            if (this.currentCash == this.apiService.cash) {
              count = 0;
            } else {
              clearInterval(this.counterRefreshBalance);
              this.apiService.simpleMessage(IENMessage.laabCashinSuccess);
              this.apiService.modal.dismiss();
              resolve(IENMessage.success);
            }
          }
        }, 1000);

      } catch (error) {
        clearInterval(this.counterRefreshBalance);
        this.apiService.simpleMessage(error.message);
        this.apiService.modal.dismiss();
        resolve(error.message);
      }
    })
  }

  

}
