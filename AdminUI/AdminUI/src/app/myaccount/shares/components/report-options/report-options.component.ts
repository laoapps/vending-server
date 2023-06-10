import { Component, OnInit } from '@angular/core';
import { ICurrentCard, IENMessage } from 'src/app/models/base.model';
import { LoadMerchantReportsProcess } from 'src/app/myaccount/processes/loadMerchantReports.process';
import { LoadVendingLimiterReportsProcess } from 'src/app/myaccount/processes/loadVendingLimiterReports.process';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { HashVerifyPage } from '../hash-verify/hash-verify.page';
const momenttimezone = require('moment-timezone');


@Component({
  selector: 'app-report-options',
  templateUrl: './report-options.component.html',
  styleUrls: ['./report-options.component.scss'],
})
export class ReportOptionsComponent implements OnInit {

  defendClick: boolean = false;

  private loadMerchantReportProcess: LoadMerchantReportsProcess;
  private loadVendingReportProcess: LoadVendingLimiterReportsProcess;

  statement: string = 'income';
  lists: any[] = [];
  currentPage: number = 1;
  limit: number = 5;
  count: number;
  btnList: Array<any> = [];
  sender: string;

  constructor(
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) { 
    this.loadMerchantReportProcess = new LoadMerchantReportsProcess(this.apiService, this.vendingAPIService);
    this.loadVendingReportProcess = new LoadVendingLimiterReportsProcess(this.apiService, this.vendingAPIService);
  }

  async ngOnInit() {
    await this.loadReport();
  }

  switchReport(statement: string): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.statement = statement;
        this.currentPage = 1;
        const run = await this.loadReport();
        if (run != IENMessage.success) throw new Error(run);

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  loadReport(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
      

        
        let run: any = {} as any;
        if (this.apiService.currentcard == ICurrentCard.merchantCoinCard) {
          this.sender = this.apiService.merchantCoinName;
          const params = {
            ownerUuid: this.apiService.ownerUuid,
            sender: this.sender,
            page: this.currentPage,
            limit: this.limit,
            statement: this.statement
          }
          run = await this.loadMerchantReportProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run.message);

        } else if (this.apiService.currentcard == ICurrentCard.vendingLimtierCoinCard) {
          this.sender = this.apiService.vendingLimiterCoinName;

          const params = {
            ownerUuid: this.apiService.ownerUuid,
            sender: this.sender,
            page: this.currentPage,
            limit: this.limit,
            statement: this.statement
          }
          run = await this.loadVendingReportProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run.message);
          
        }

        if (run.data[0].count == 0) return resolve(IENMessage.success);

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

  managePage(page: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.currentPage = page;
        const run = await this.loadReport();
        if (run != IENMessage.success) throw new Error(run);

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  gotoDetail(m: any, balanceType: string, verifymode: string, description: string) {
    console.log(`sender`, this.sender);
    if (this.defendClick == true) return;
    if (this.defendClick == false) {
      this.defendClick = true;
      console.log(`balance type der`, balanceType);
      let hashM = '';
      let info = '';
      if (typeof (m) == 'string') {
        hashM = m;
      } else {
        hashM = m.hash;
        info = m.info;
      }
      console.log(hashM, balanceType);

  
      this.apiService.modal.create({ component: HashVerifyPage, componentProps: {sender: this.sender, balanceType: balanceType, back: 'expend', hashM: hashM, info: info, verifymode: verifymode, description: description } }).then(r => {
        r.present();
        r.onDidDismiss().then(() => this.defendClick = false);
      })
  
    }

  }

}
