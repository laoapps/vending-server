import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { TransferValidationProcess } from '../../LAAB_processes/transferValidation.process';
import { MMoneyCashOutValidationProcess } from '../../LAAB_processes/mmoneyCashoutValidation.process';
// import Swal from 'sweetalert2';
import { GetMMoneyUserInfoProccess } from '../../LAAB_processes/getMMoneyUserInfo.process';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-mmoney-cashout',
  templateUrl: './mmoney-cashout.page.html',
  styleUrls: ['./mmoney-cashout.page.scss'],
})
export class MmoneyCashoutPage implements OnInit {

  @Input() stackCashoutPage: any;

  showPhonenumberPage: boolean = true;
  showMMoneyProfile: boolean = false;

  private transferValidationProcess: TransferValidationProcess;
  private mmoneyCashoutValidationProcess: MMoneyCashOutValidationProcess;
  private getMMoneyUserInfoProcess: GetMMoneyUserInfoProccess;

  subtitle: string = 'Enter your mmoney account';
  numberList: Array<string> = [];
  placeholder: string = 'ENTER PHONE NUMBER';
  phonenumber: string;
  fullname: string;

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService,
    public modal: ModalController
  ) {
    this.apiService.___MmoneyCashoutPage = this.modal;

    this.transferValidationProcess = new TransferValidationProcess(this.apiService, this.vendingAPIService);
    this.mmoneyCashoutValidationProcess = new MMoneyCashOutValidationProcess(this.apiService, this.vendingAPIService);
    this.getMMoneyUserInfoProcess = new GetMMoneyUserInfoProccess(this.apiService);

  }

  ngOnInit() {
    this.apiService.autopilot.auto = 0;
    this.loadNumberList();
    this.apiService.soundInputMmoneyPhonenumber();
  }

  loadNumberList(): void {
    for (let i = 1; i < 10; i++) {
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

  customePhonenumber() {
    this.showPhonenumberPage = true;
    this.showMMoneyProfile = false;
    this.fullname = '';
  }
  next(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        if (this.phonenumber == this.placeholder) throw new Error(IENMessage.invalidPhonenumber);

        const params = {
          phonenumber: this.phonenumber
        }
        const run = await this.getMMoneyUserInfoProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.showPhonenumberPage = false;
        this.showMMoneyProfile = true;
        this.fullname = run.data[0].name + ' ' + run.data[0].surname;


        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }


  transfer(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        if (this.phonenumber == this.placeholder) throw new Error(IENMessage.parametersEmpty);
        let moneyFormat = this.apiService.formatMoney(this.apiService.cash.amount).toString();
        moneyFormat = moneyFormat.split('.00')[0];

        const params = {
          phonenumber: this.phonenumber,
          cash: this.apiService.cash.amount // debug here
        }
        const run = await this.mmoneyCashoutValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        // Swal.fire({
        //   icon: 'success',
        //   title: 'MMoney Cash out',
        //   text: `MMoney account ${this.phonenumber} receive about ${moneyFormat}`,
        //   heightAuto: false,
        //   showConfirmButton: true,
        //   confirmButtonText: 'OK',
        //   confirmButtonColor: '#28B463'
        // });

        this.apiService.alertSuccess(`MMoney account ${this.phonenumber} receive about ${moneyFormat}`);
        // this.apiService.cash.amount = Number(this.apiService.cash.amount);
        this.stackCashoutPage.dismiss();
        this.apiService.modalCtrl.dismiss();
        // this.apiService.simpleMessage(IENMessage.cashoutToAnotherLAABAccountSuccess);
        resolve(IENMessage.success);

      } catch (error) {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'MMoney Cash out',
        //   text: `Cash out from vending between MMoney fail`,
        //   showConfirmButton: true,
        //   confirmButtonText: 'OK',
        //   confirmButtonColor: '#EE3124',
        //   heightAuto: false
        // });
        this.apiService.alertError('Cash out from vending between MMoney fail');
        this.stackCashoutPage.dismiss();
        this.apiService.modalCtrl.dismiss();
        // this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  close() {
    this.apiService.modalCtrl.dismiss();
  }

}
