import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { LoadSMCProcess } from '../../LAAB_processes/loadSMC.process';
import { IENMessage } from 'src/app/models/base.model';
import { CreateEPINProcess } from '../../LAAB_processes/createEPIN.process';
import * as QRCode from 'qrcode';
import { EpinShowCodePage } from '../epin-show-code/epin-show-code.page';
import moment from 'moment';

@Component({
  selector: 'app-smc-list',
  templateUrl: './smc-list.page.html',
  styleUrls: ['./smc-list.page.scss'],
})
export class SmcListPage implements OnInit {

  private loadSMCListProcess: LoadSMCProcess;
  private createEPINProcess: CreateEPINProcess;

  @Input() machineId: string;

  page: number = 1;
  limit: number = 6;
  lists: Array<any> = [];
  count: number = 0;
  totalpage: number = 0;

  currentScroll: number = 345;
  private hiddenList: Array<any> = [];

  constructor(
    public apiService: ApiService,
    public vendingAPIService: VendingAPIService
  ) { 
    this.loadSMCListProcess = new LoadSMCProcess(this.apiService, this.vendingAPIService);
    this.createEPINProcess = new CreateEPINProcess(this.apiService, this.vendingAPIService);

  }

  async ngOnInit() {
    this.apiService.autopilot.auto=0;
    this.loadHideList();
    await this.loadSMC();

    const elm = (document.querySelector('#smc-list-scroll') as HTMLDivElement);

    elm.addEventListener('scroll', async event => {

      if (Math.ceil(elm.scrollTop) == this.currentScroll || Math.ceil(elm.scrollTop) == this.currentScroll - 1 || Math.ceil(elm.scrollTop) == this.currentScroll + 1) {
        if (this.lists != undefined && Object.entries(this.lists).length != this.count) {
          this.currentScroll += 345;
          this.page += 1;
          console.log(`page`, this.page);
          const run = await this.loadSMC();
          if (run != IENMessage.success) {
            this.apiService.simpleMessage(run);
          }
        }
      }
    });
  }

  loadHideList() {
    const local = localStorage.getItem('epin_hide_list');
    if (local != undefined && local != undefined) {
      this.hiddenList = JSON.parse(local);
    }
  }

  loadSMC(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const params = {
          machineId: this.machineId,
          page: this.page,
          limit: this.limit,
        }
        console.log(`params`, params);
        const run = await this.loadSMCListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.count = run.data[0].count;
        this.totalpage = Math.ceil(this.count / this.limit);
        if (this.lists != undefined && Object.entries(this.lists).length == 0) {
          this.lists = run.data[0].rows;
        } else if (this.lists != undefined && Object.entries(this.lists).length > 0) {
          this.lists = this.lists.concat(run.data[0].rows);
        }
        
        console.log(`lists`, this.lists);
        const c = this.lists.filter(v=>!this.hiddenList.find(vx=>vx.uuid==v.uuid));
        console.log(`c`, c);
        this.lists=
        this.lists.filter(v=> this.hiddenList.find(vx=>vx.uuid==v.uuid&&moment().diff
        (
          moment(vx.time),'seconds'
        )
        >
        24*60*60));

        this.lists =this.lists.concat(c);
        this.lists = this.lists.sort((a,b) => a.id-b.id);
        
        resolve(IENMessage.success);
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  scrollLoadSMC(event: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        if (this.lists != undefined && Object.entries(this.lists).length == this.count) {
          event.target.complete();
          resolve(IENMessage.success);

        } else {
          console.log(`here`, this.lists.length, this.totalpage);
          this.page += 1;
          const run = await this.loadSMC();
          if (run != IENMessage.success) {
            this.apiService.simpleMessage(run);
            resolve(run);
          }
          event.target.complete();
          resolve(IENMessage.success);
        }
        


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  close() {
    this.apiService.modal.dismiss();
  }

  createEPIN(data: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let local = localStorage.getItem('smc_list');
        if (local == undefined || local == null) throw new Error(IENMessage.thisSmcHaveAlreadyUsedOrThatOneWasDelete);
        
        const localList: Array<any> = JSON.parse(local);
        console.log(`local`, localList);
        console.log(`data`, data);
        const findsave: Array<any> = localList.filter(item => item.bill.chash == data.hash);
        if (findsave != undefined && Object.entries(findsave).length == 0) throw new Error(IENMessage.notFoundAnySaveSMC);
        

        console.log(`save`, findsave);
        
        
        const params = {
          machineId: localStorage.getItem('machineId'),
          detail: findsave[0].detail
        }
        console.log(`params`, params);
        const run = await this.createEPINProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.lists = this.lists.filter(item => item.id !== data.id);

        const model = {
          type: 'EQR',
          mode: 'EPIN',
          destination: findsave[0].detail.items[0].qrcode[0],
          options: {
            coinname: this.apiService.coinName,
            name: findsave[0].detail.sender
          }
        }
        console.log(`params`, model);
        QRCode.toDataURL(JSON.stringify(model)).then(async r => {
          const props = {
            data: data,
            qrImage: r,
            code: findsave[0].detail.items[0].code[0] 
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

}
