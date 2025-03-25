import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { TransferValidationProcess } from '../../LAAB_processes/transferValidation.process';
import { MMoneyCashOutValidationProcess } from '../../LAAB_processes/mmoneyCashoutValidation.process';
import Swal from 'sweetalert2';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-laab-cashout',
  templateUrl: './laab-cashout.page.html',
  styleUrls: ['./laab-cashout.page.scss'],
})
export class LaabCashoutPage implements OnInit {

  @Input() stackCashoutPage: any;

  private transferValidationProcess: TransferValidationProcess;
  private mmoneyCashoutValidationProcess: MMoneyCashOutValidationProcess;

  numberList: Array<string> = [];
  placeholder: string = 'ENTER PHONE NUMBER';
  phonenumber: string;

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService,
    public modal: ModalController
  ) { 
    this.apiService.___LaabCashoutPage = this.modal;

    this.transferValidationProcess = new TransferValidationProcess(this.apiService, this.vendingAPIService);
    this.mmoneyCashoutValidationProcess = new MMoneyCashOutValidationProcess(this.apiService, this.vendingAPIService);

  }

  ngOnInit() {
    this.apiService.autopilot.auto=0;
    this.loadNumberList();
    this.apiService.soundInputLaabPhonenumber();
  }

  loadNumberList(): void {
    for(let i = 1; i < 10; i++) {
      this.numberList.push(i.toString());
    }
    this.phonenumber = this.placeholder;
  }

  processDigits(digit: string) {
    if (this.phonenumber == this.placeholder) {
      if (digit != '0') {
        this.phonenumber = digit;
      }
    } else {
      if (this.phonenumber.length < 10) {
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
        let moneyFormat = this.apiService.formatMoney(this.apiService.cash.amount).toString();
        moneyFormat = moneyFormat.split('.00')[0];
        const params = {
          machineId: localStorage.getItem('machineId'),
          receiver: this.phonenumber,
          cash: this.apiService.cash.amount,
          description: 'VENDING CASH OUT TO ANOTHER LAAB ACCOUNT'
        }

        const run = await this.transferValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        Swal.fire({
          icon: 'success',
          title: 'LAAB Cash out',
          text: `LAAB account ${this.phonenumber} receive about ${moneyFormat}`,
          heightAuto: false,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#28B463'
        });
        this.apiService.cash.amount = 0;
        this.stackCashoutPage.dismiss();
        this.apiService.modal.dismiss();
        // this.apiService.simpleMessage(IENMessage.cashoutToAnotherLAABAccountSuccess);
        resolve(IENMessage.success);

      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'MMoney Cash out',
          text: `Cash out from vending between LAAB fail`,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#EE3124',
          heightAuto: false
        });
        // this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  close() {
    this.apiService.modal.dismiss();
  }
}
