import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingMachineSaleBillReportProcess } from '../processes/loadVendingMachineBillReport.process';
import { SaleReportViewPage } from 'src/app/sale-report-view/sale-report-view.page';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.page.html',
  styleUrls: ['./sale-report.page.scss'],
})
export class SaleReportPage implements OnInit {

  private loadVendingMachineSaleBillReportProcess: LoadVendingMachineSaleBillReportProcess;
  
  @Input() machineId: string;
  @Input() otp: string;

  datetimeCustom: boolean = true;
  moredatetimeCustom: boolean = false;
  display: boolean = false;

  fromDate: string;
  toDate: string;

  lists: Array<any> = [];
  count: number = 0;
  saleDetailList: Array<any> = [];
  saleSumerizeList: Array<any> = [];

  exportOptions: Array<any> = [
    {
      icon: 'fa-solid fa-file-pdf text-danger',
      text: 'Export PDF'
    },
    {
      icon: 'fa-solid fa-file-excel text-success',
      text: 'Export Excel'
    }
  ];
  
  constructor(
    public apiService: ApiService
  ) { 
    this.loadVendingMachineSaleBillReportProcess = new LoadVendingMachineSaleBillReportProcess(this.apiService);
  }

  ngOnInit() {
    this.toggleButtons();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  toggleButtons() {
    const btns = (document.querySelectorAll('.section-buttons .item') as NodeListOf<HTMLHRElement>);
    btns.forEach((item, index) => {
      item.addEventListener('click', event => {
        item.classList.add('active');
        btns.forEach((obj, oindex) => {
          if (index != oindex) {
            obj.classList.remove('active');
          }
        });
      });
    });
  }

  displayDateTimeCustom() {
    if (this.datetimeCustom == false) {
      this.datetimeCustom = true;
      this.moredatetimeCustom = false;
      this.clearInput();
    }
  }
  displayMoreDateTimeCustom() {
    if (this.moredatetimeCustom == false) {
      this.datetimeCustom = false;
      this.moredatetimeCustom = true;
      this.clearInput();
    }
  }
  clearInput() {
    this.fromDate = undefined;
    this.toDate = undefined;
  }

  process(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        this.lists = [];
        this.display = false;
        console.log(this.moredatetimeCustom, this.datetimeCustom);

        let params: any = {} as any;
        if (this.datetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.fromDate
          }

        } else if (this.moredatetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.toDate
          }
        }

        const run = await this.loadVendingMachineSaleBillReportProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.lists = run.data[0].lists;
        this.count = run.data[0].count;
        this.saleDetailList = run.data[0].saleDetailList;
        this.saleSumerizeList = run.data[0].saleSumerizeList;
        console.log(this.moredatetimeCustom, this.datetimeCustom);
        if (this.count > 0) this.display = true;
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }

  view(list: any): void {
    let currentdate: string = '';
    if (this.datetimeCustom == true) {
      currentdate = this.fromDate;
    } else {
      currentdate = `From ${this.toDate} to ${this.fromDate}`;
    }
    const props = {
      machineId: this.machineId,
      currentdate: currentdate,
      list: list,
      saleDetailList: this.saleDetailList
    }
    this.apiService.showModal(SaleReportViewPage, props).then(r => {
      r.present();
    });
  }
}
