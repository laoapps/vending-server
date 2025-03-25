import { Component, OnInit } from '@angular/core';
import { EpinShowcodePage } from '../epin-subadmin/epin-showcode/epin-showcode.page';
import { IENMessage } from '../models/base.model';
import { ApiService } from '../services/api.service';
import { VendingAPIService } from '../services/vending-api.service';
import { FindEPINShortCodeListProcess } from './processes/findEPINShortCodeList.process';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-find-my-epin',
  templateUrl: './find-my-epin.page.html',
  styleUrls: ['./find-my-epin.page.scss'],
})
export class FindMyEpinPage implements OnInit {

  private findEPINShortCodeListProcess: FindEPINShortCodeListProcess;

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
    this.findEPINShortCodeListProcess = new FindEPINShortCodeListProcess(this.apiService, this.vendingAPIServgice);
  }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

  resetList(e: Event) {
    this.lists = [];
    this.showTable = false;
  }

  searchList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
      
        this.lists = [];
        this.btnList = [];
        
        const params = {
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

        this.currentPage = page;
        const run = await this.searchList();   


        if (run != IENMessage.success) throw new Error(run);
        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  generateScan(list: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const model = {
          type: 'EQR',
          mode: 'EPIN',
          destination: list.EPIN.destination,
          options: {
            coinname: list.EPIN.coinname,
            name: list.EPIN.name,
          }
        }
        console.log(`params`, model);
        QRCode.toDataURL(JSON.stringify(model)).then(async r => {
          const props = {
            qrImage: r,
            code: list.SMC.detail.items[0].code[0] 
          }
          this.apiService.modal.create({ component: EpinShowcodePage, componentProps: props }).then(r => {
            r.present();
            // this.apiService.modal.dismiss();
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
