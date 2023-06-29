import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LaabCashoutPage } from '../laab-cashout/laab-cashout.page';
import { EpinCashOutPage } from '../epin-cash-out/epin-cash-out.page';

@Component({
  selector: 'app-stack-cashout',
  templateUrl: './stack-cashout.page.html',
  styleUrls: ['./stack-cashout.page.scss'],
})
export class StackCashoutPage implements OnInit {

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
  }

  laabCashout(state: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        const props = {
          state: state
        };
        this.apiService.modal
          .create({ component: LaabCashoutPage, componentProps: props })
          .then((r) => {
            r.present();
            resolve(IENMessage.success);
          });
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  epinCashOut(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.apiService.modal
          .create({ component: EpinCashOutPage, componentProps: {} })
          .then((r) => {
            r.present();
          });
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  close() {
    this.apiService.modal.dismiss();
  }
}
