import { Component, Input, OnInit } from '@angular/core';
import { PaidValidationProcess } from '../../processes/paidValidation.process';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { IENMessage } from 'src/app/models/base.model';

@Component({
  selector: 'app-laab-go',
  templateUrl: './laab-go.page.html',
  styleUrls: ['./laab-go.page.scss'],
})
export class LaabGoPage implements OnInit {

  @Input() machineId: string;
  @Input() cash: number;
  @Input() quantity: number;
  @Input() total: number;
  @Input() refund: number;
  @Input() paidLAAB: any;

  private paidValidationProcess: PaidValidationProcess;

  constructor(
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) { 
    this.paidValidationProcess = new PaidValidationProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
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

        const run = await this.paidValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        //

        this.apiService.cash = this.refund;
        this.apiService.modal.dismiss();
        resolve(IENMessage.success);
        
      } catch (error) {
        resolve(error.message);
      }
    });
  }

  close() {
    this.apiService.modal.dismiss();
  }

}
