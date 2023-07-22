import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as moment from 'moment';
import * as momenttimezone from 'moment-timezone';
import { CounterCashout_CashProcess } from '../processes/counterCashout_cash.process';
import { FindEPINShortCodeListProcess } from '../processes/findEPINShortCodeList.process';
import { ReCreateEPINProcess } from '../processes/recreateEPIN.process';
import { ShowEPINShortCodeListProcess } from '../processes/showEPINShortCodeList.process';

@Component({
  selector: 'app-manage-epin',
  templateUrl: './manage-epin.page.html',
  styleUrls: ['./manage-epin.page.scss'],
})
export class ManageEpinPage implements OnInit {

  private showEPINShortCodeListProcess: ShowEPINShortCodeListProcess;
  private findEPINShortCodeListProcess: FindEPINShortCodeListProcess;
  private recreateEPINProcess: ReCreateEPINProcess;
  private counterCashout_cashProcess: CounterCashout_CashProcess;

  counter: boolean = false;
  showTable: boolean = false;
  phonenumber: string;

  lists: any[] = [];
  currentPage: number = 1;
  limit: number = 5;
  count: number;
  btnList: Array<any> = [];

  constructor(
    private apiService: ApiService,
    private vendingAPIServgice: VendingAPIService
  ) { 
    this.showEPINShortCodeListProcess = new ShowEPINShortCodeListProcess(this.apiService, this.vendingAPIServgice);
    this.findEPINShortCodeListProcess = new FindEPINShortCodeListProcess(this.apiService, this.vendingAPIServgice);
    this.recreateEPINProcess = new ReCreateEPINProcess(this.apiService, this.vendingAPIServgice);
    this.counterCashout_cashProcess = new CounterCashout_CashProcess(this.apiService, this.vendingAPIServgice);
  }


  ngOnInit() {
    this.showList();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  resetList(e: Event) {
    this.lists = [];
    this.showTable = false;
  }
  // getTime(e: Event) {
  //   this.time = momenttimezone((e.target as HTMLInputElement).value).tz("Asia/Vientiane").format('D/M/YYYY HH:mm:ss');
  //   console.log(`change`, this.time);
  // }
  showList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.lists = [];
        this.btnList = [];
        
        
        const params = {
          counter: this.counter,
          page: this.currentPage,
          limit: this.limit,
        }
        console.log(`params`, params);
        const run = await this.showEPINShortCodeListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        if (run.data[0].count == 0) {
          this.showTable = false;
          throw new Error(IENMessage.notFoundAnyDataList);
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
  refreshList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.lists = [];
        this.btnList = [];
        this.currentPage = 1;
        
        
        const params = {
          counter: this.counter,
          page: this.currentPage,
          limit: this.limit,
        }
        const run = await this.showEPINShortCodeListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        if (run.data[0].count == 0) {
          this.showTable = false;
          throw new Error(IENMessage.notFoundAnyDataList);
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
  resetSearchList(e: Event): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        let value: any = (e.target as HTMLSelectElement).value;
        if (value == '') {
          this.currentPage = 1;
          const run = await this.showList();
          if (run != IENMessage.success) throw new Error(run);
        }

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }
  searchList(page?: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
      
        this.lists = [];
        this.btnList = [];
        this.currentPage = page ? page : this.currentPage;
        
        const params = {
          counter: this.counter,
          phonenumber: this.phonenumber,
          page: this.currentPage,
          limit: this.limit,
        }
        const run = await this.findEPINShortCodeListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        if (run.data[0].count == 0) {
          this.showTable = false;
          throw new Error(IENMessage.notFoundAnyDataList);
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

        let run: any = {} as any;
        this.currentPage = page;

        if (this.phonenumber != undefined && this.phonenumber != '' && Object.entries(this.phonenumber).length > 0) {
          run = await this.searchList();   
        } else 
        {
          run = await this.showList(); 
        }

        if (run != IENMessage.success) throw new Error(run);
        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  switchShowLimit(e: Event): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const value = Number((e.target as HTMLSelectElement).value);
        if (value != this.limit) {
          this.currentPage = 1;
          this.limit = value;
          const run = await this.showList();
          if (run != IENMessage.success) throw new Error(run);
          this.phonenumber = '';
        }
        

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }
  switchShowStatus(e: Event): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        let value: any = (e.target as HTMLSelectElement).value;
        if (value == 'true') value = true;
        else value = false;

        if (value != this.counter) {
          this.currentPage = 1;
          this.counter = value;
          const run = await this.showList();
          if (run != IENMessage.success) throw new Error(run);
          this.phonenumber = '';
        }
        

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }

  recreateEPIN(data: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const params = {
          machineId: data.creator,
          phonenumber: this.phonenumber,
          detail: data.SMC.detail
        }

        const run = await this.recreateEPINProcess.Init(params);
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
        console.log(`data`, data);
        const params = {
          phonenumber: this.phonenumber,
          destination: data.EPIN.destination,
          coinname: data.EPIN.coinname,
          name: data.EPIN.name
        }

        const run = await this.counterCashout_cashProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.lists = this.lists.filter(item => item.uuid == data.uuid);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }


}
