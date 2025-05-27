import { Component, Input, OnInit } from '@angular/core';
import { PaidValidationProcess } from '../../LAAB_processes/paidValidation.process';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { IENMessage } from 'src/app/models/base.model';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-laab-go',
    templateUrl: './laab-go.page.html',
    styleUrls: ['./laab-go.page.scss'],
    standalone: false
})
export class LaabGoPage implements OnInit {

  public static static_apiService: ApiService;

  @Input() machineId: string;
  @Input() cash: number;
  @Input() quantity: number;
  @Input() total: number;
  @Input() balance: number;
  @Input() paidLAAB: any;
  @Input() vendingGoPage: any;

  private paidValidationProcess: PaidValidationProcess;

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService,
    public modal: ModalController
  ) { 
    this.apiService.___LaabGoPage = this.modal;
    this.paidValidationProcess = new PaidValidationProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
    this.apiService.autopilot.auto=0;
    console.log(`total`, this.total, this.balance);
  }

  paidValidation(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const params = {
          machineId: this.machineId,
          cash: this.total,
          description: 'VENDING WALLET COMMIT ORDER',
          paidLAAB: this.paidLAAB
        }
        console.log(`params`, params);
        const run = await this.paidValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        //

        this.apiService.cash.amount = this.balance;
        this.apiService.myTab1.clearStockAfterLAABGo();
        this.vendingGoPage.dismiss();
        this.apiService.modal.dismiss();
        // await this.apiService.openSoundReady();
        // this.apiService.modal.dismiss();
        resolve(IENMessage.success);
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  close() {
    this.apiService.modal.dismiss();
  }

}
