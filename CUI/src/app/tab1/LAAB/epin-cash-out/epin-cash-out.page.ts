import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { CreateSMCProcess } from '../../processes/createSMC.process';
import { IENMessage } from 'src/app/models/base.model';
import { EpinShowCodePage } from '../epin-show-code/epin-show-code.page';
import { SmcListPage } from '../smc-list/smc-list.page';
import * as QRCode from 'qrcode';
import { CreateEPINProcess } from '../../processes/createEPIN.process';

@Component({
  selector: 'app-epin-cash-out',
  templateUrl: './epin-cash-out.page.html',
  styleUrls: ['./epin-cash-out.page.scss'],
})
export class EpinCashOutPage implements OnInit {

  private createSMCProcess: CreateSMCProcess;
  private createEPINProcess: CreateEPINProcess;

  
  showPhonenumberPage: boolean = true;
  showEPINCashoutPage: boolean = false;

  numberList: Array<string> = [];
  placeholder: string = 'ENTER PHONE NUMBER';
  phonenumber: string;
  btnCreateSMC: boolean = false;

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService
  ) { 
    this.createSMCProcess = new CreateSMCProcess(this.apiService, this.vendingAPIService);
    this.createEPINProcess = new CreateEPINProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
    this.loadNumberList();
    this.checkBalance();

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

  next(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (this.phonenumber == this.placeholder) throw new Error(IENMessage.invalidPhonenumber);
        if (this.phonenumber != this.placeholder && this.phonenumber.length != 8) throw new Error(IENMessage.invalidPhonenumber);
        this.phonenumber = `+85620${this.phonenumber}`;

        this.showPhonenumberPage = false;
        this.showEPINCashoutPage = true;

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

  checkBalance() {
    if (this.apiService.cash > 0) {
      this.btnCreateSMC = true;
    } else {
      this.btnCreateSMC = false;
    }
  }

  createSMC(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
       
        if (this.btnCreateSMC == false) throw new Error(IENMessage.thereIsNotBalance);

        let params: any = {
          machineId: localStorage.getItem('machineId'),
          phonenumber: this.phonenumber,
          cash: this.apiService.cash
        }

        let run: any = await this.createSMCProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.apiService.cash = 0;
        this.btnCreateSMC = false;

        console.log(`afer create skc`, run.data);


        let local = localStorage.getItem('smc_list');
        let localList: Array<any> = [];
        if (local == undefined || local == null) {

          const array: Array<any> = [run.data[0]];
          localStorage.setItem('smc_list', JSON.stringify(array));
        } else {
          localList = JSON.parse(local);
          localList.unshift(run.data[0]);
          localStorage.setItem('smc_list', JSON.stringify(localList));
        }

        params = {
          machineId: localStorage.getItem('machineId'),
          phonenumber: this.phonenumber,
          detail: run.data[0].detail
        }
        const createEPIN = await this.createEPINProcess.Init(params);
        console.log(`ruunnn`, run);
        if (createEPIN.message != IENMessage.success) throw new Error(run);

        localList = localList.filter(item => item.link !== run.data[0].detail.link);
        localStorage.setItem('smc_list', JSON.stringify(localList));



        const model = {
          type: 'EQR',
          mode: 'EPIN',
          destination: run.data[0].detail.items[0].qrcode[0],
          options: {
            coinname: this.apiService.coinName,
            name: run.data[0].detail.sender
          }
        }
        console.log(`params`, model);
        QRCode.toDataURL(JSON.stringify(model)).then(async r => {
          const props = {
            qrImage: r,
            code: run.data[0].detail.items[0].code[0] 
          }
          this.apiService.modal.create({ component: EpinShowCodePage, componentProps: props }).then(r => {
            r.present();
            resolve(IENMessage.success);
          });
        });


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  smcList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const props = {
          machineId: localStorage.getItem('machineId') || '12345678'
        }
        this.apiService.modal.create({ component: SmcListPage, componentProps: props }).then(r => {
          r.present();
          resolve(IENMessage.success);
        });

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

}
