import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { FindEPINShortCodeListProcess } from '../../../processes/findEPINShortCodeList.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as moment from 'moment';
import * as momenttimezone from 'moment-timezone';
import { CreateEPINProcess } from '../../../processes/createEPIN.process';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
})
export class CounterComponent implements OnInit {

  private findEPINShortCodeListProcess: FindEPINShortCodeListProcess;
  private createEPINProcess: CreateEPINProcess;

  showTable: boolean = false;
  phonenumber: string;
  time: string;

  lists: any[] = [];
  currentPage: number = 1;
  limit: number = 5;
  count: number;
  btnList: Array<any> = [];

  constructor(
    private apiService: ApiService,
    private vendingAPIServgice: VendingAPIService
  ) { 
    this.findEPINShortCodeListProcess = new FindEPINShortCodeListProcess(this.apiService, this.vendingAPIServgice);
    this.createEPINProcess = new CreateEPINProcess(this.apiService, this.vendingAPIServgice);
  }

  ngOnInit() {}

  resetList(e: Event) {
    if ((e.target as HTMLInputElement).value) {
      this.lists = [];
      this.showTable = false;
    }
  }
  getTime(e: Event) {
    this.time = momenttimezone((e.target as HTMLInputElement).value).tz("Asia/Vientiane").format('D/M/YYYY HH:mm:ss');
    console.log(`change`, this.time);
  }
  findList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        console.log(`time`, this.time);

        if (!(this.phonenumber)) throw new Error(IENMessage.pleaseEnterPhonenumber);
        if (!(this.time)) throw new Error(IENMessage.invalidTime);

        // this.showTable = true;
        
        const params = {
          machineId: this.apiService.currentMachineId,
          phonenumber: this.phonenumber,
          time: this.time,
          page: this.currentPage,
          limit: this.limit,
        }
        const run = await this.findEPINShortCodeListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run.message);

        if (run.data[0].count == 0) {
          this.showTable = false;
          return resolve(IENMessage.success);
        }
        this.showTable = true;

        this.lists = run.data[0].rows;
        this.count = Number(run.data[0].count);

        const totalPage = Math.ceil(this.count / this.limit);
        this.btnList = this.apiService.paginations(this.currentPage, totalPage);

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  manageListPage(page: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.currentPage = page;
        const run = await this.findList();
        if (run != IENMessage.success) throw new Error(run);

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  createEPIN(data: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const params = {
          machineId: this.apiService.currentMachineId,
          phonenumber: this.phonenumber,
          detail: data.SMC
        }

        const run = await this.createEPINProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.lists.filter(item => {
          if (item.uuid == run.data[0].EPIN.uuid) {
            item.EPIN = run.data[0].EPIN;
          }
          return true;
        });

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  
  counterCashout_Cash(data: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const params = {
          machineId: this.apiService.currentMachineId,
          phonenumber: this.phonenumber,
          detail: data.SMC
        }

        const run = await this.createEPINProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.lists.filter(item => {
          if (item.uuid == run.data[0].EPIN.uuid) {
            item.EPIN = run.data[0].EPIN;
          }
          return true;
        });

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
}
