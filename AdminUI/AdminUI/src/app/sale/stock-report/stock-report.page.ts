import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingMachineStockReportProcess } from '../processes/loadVendingMachineStockReport.process';
import { IENMessage } from 'src/app/models/base.model';

@Component({
  selector: 'app-stock-report',
  templateUrl: './stock-report.page.html',
  styleUrls: ['./stock-report.page.scss'],
})
export class StockReportPage implements OnInit {

  private loadVendingMachineStockReportProcess: LoadVendingMachineStockReportProcess;

  @Input() machineId: string;
  @Input() otp: string;

  datetimeCustom: boolean = true;
  moredatetimeCustom: boolean = false;
  display: boolean = false;

  fromDate: string;
  toDate: string;

  lists: Array<any> = [];
  count: number = 0;
  currentdate: string = '';

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

  stackList: Array<any> = [];
  positionList: Array<any> = [];
  checks: Array<any> = [];

  constructor(
    public apiService: ApiService
  ) { 
    this.loadVendingMachineStockReportProcess = new LoadVendingMachineStockReportProcess(this.apiService);
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

        let params: any = {} as any;
        if (this.datetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.fromDate,
            machineId: this.machineId
          }
          this.currentdate = this.fromDate;

        } else if (this.moredatetimeCustom == true) {
          params = {
            fromDate: this.fromDate,
            toDate: this.toDate,
            machineId: this.machineId
          }
          this.currentdate = `From ${this.fromDate} to ${this.toDate}`;

        }

        const run = await this.loadVendingMachineStockReportProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.lists = run.data[0].lists;
        this.count = run.data[0].count;
        this.stackList = run.data[0].stacks;
        this.positionList = run.data[0].stacks.map(item => { return { position: item.position, name: item.name } });
        this.checks = run.data[0].stacks.map(item => item.detail.qtty);
        console.log(`checks`, this.checks);
        if (this.count > 0) this.display = true;


        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }

}
