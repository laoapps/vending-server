import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { TransferValidationProcess } from '../../processes/transferValidation.process';

@Component({
  selector: 'app-laab-cashout',
  templateUrl: './laab-cashout.page.html',
  styleUrls: ['./laab-cashout.page.scss'],
})
export class LaabCashoutPage implements OnInit {

  private transferValidationProcess: TransferValidationProcess;

  numberList: Array<string> = [];
  placeholder: string = 'ENTER PHONE NUMBER';
  phonenumber: string;

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService
  ) { 
    this.transferValidationProcess = new TransferValidationProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
    this.loadNumberList();
  }

  loadNumberList(): void {
    for(let i = 1; i < 10; i++) {
      this.numberList.push(i.toString());
    }
    this.phonenumber = this.placeholder;
  }

  processDigits(digit: string) {
    if (this.phonenumber == this.placeholder) {
      this.phonenumber = digit;
    } else {
      if (this.phonenumber.length < 8) {
        this.phonenumber += digit;
      }
    }
  }
  deleteDigits() {
    if (this.phonenumber != this.placeholder) {
      if (this.phonenumber != undefined && Object.entries(this.phonenumber).length == 1) {
        this.phonenumber = this.placeholder;
      } else {
        this.phonenumber = this.phonenumber.substring(0, this.phonenumber.length - 1);
      }
    }
  }
  transfer(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
       
        if (this.phonenumber == this.placeholder) throw new Error(IENMessage.parametersEmpty);

        const params = {
          machineId: localStorage.getItem('machineId'),
          receiver: this.phonenumber,
          cash: this.apiService.cash,
          description: 'VENDING CASH OUT TO ANOTHER LAAB ACCOUNT'
        }

        if (this.phonenumber == this.placeholder) throw new Error(IENMessage.parametersEmpty);

        const run = await this.transferValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.apiService.cash = 0;
        this.apiService.simpleMessage(IENMessage.cashoutToAnotherLAABAccountSuccess);
        this.apiService.modal.dismiss();
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
