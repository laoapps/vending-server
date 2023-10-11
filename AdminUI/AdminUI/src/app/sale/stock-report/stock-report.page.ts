import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingMachineStockReportProcess } from '../processes/loadVendingMachineStockReport.process';
import { IENMessage } from 'src/app/models/base.model';
import * as moment from 'moment';
import * as momenttimezone from "moment-timezone";

@Component({
  selector: 'app-stock-report',
  templateUrl: './stock-report.page.html',
  styleUrls: ['./stock-report.page.scss'],
})
export class StockReportPage implements OnInit, OnDestroy {

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

  // interval
  private reloadElement: any = {} as any;

  // Doms
  static tbbody: HTMLElement;

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
    this.loadVendingMachineStockReportProcess = new LoadVendingMachineStockReportProcess(this.apiService);
  }


  ngOnInit() {
    this.DOMs();
    this.toggleButtons();
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadElement);
  }

  close() {
    this.apiService.modal.dismiss();
  }

  DOMs() {

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

        if (this.count > 0) this.display = true;
        await this._renderTable();
      

        resolve(IENMessage.success);

      } catch (error) {
        console.log(`error`, error.message);
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }

  private _renderTable(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const loading = this.apiService.load.create({ message: 'Rendering...', duration:  15000 });
        (await loading).present();
        this.reloadElement = setInterval(async () => {
          clearInterval(this.reloadElement);

          StockReportPage.tbbody = (document.querySelector('.tb-body') as HTMLElement);
          let tds: Array<HTMLDivElement> = [] as any;
          let tr: HTMLDivElement = undefined;
          for(let i = 0; i < this.lists.length; i++) {
            if (tr == undefined) tr = document.createElement('tr');
  
            if (this.lists[i-1] != undefined && this.lists[i-1].position == this.lists[i].position) {
              const div = document.createElement('div');
              const detail = document.createElement('div');
              div.className = 'tb-body-item';
              // const date = moment(this.lists[i].time).utcOffset('UTC+7').format('YYYY-MM-DD hh:mm:ss')
              const date = momenttimezone(this.lists[i].time).tz("Asia/Vientiane").format('D/M/YYYY HH:mm:ss')
              // detail.textContent = `Position ${this.lists[i].position} Date ${this.lists[i].time} Name ${this.lists[i].name} QTTY ${this.lists[i].qtty}`;
              detail.textContent = `Position ${this.lists[i].position} Date ${date} Name ${this.lists[i].name} QTTY ${this.lists[i].qtty}`;

              if (this.lists[i].refill == true)  {
                div.style.background = '#2ECC71';
                div.style.height = '5px';
                div.style.borderRadius = '5px';
              }
              div.classList.add('active');
              const td = document.createElement('td');
              td.appendChild(div);
              td.appendChild(detail);
              
              tds.push(td);
  
            } else {
  
              tds.forEach(td => {
                tr.appendChild(td);
              });
              StockReportPage.tbbody.appendChild(tr);
              tds = [];
              tr = undefined;
            }

            if (i+1 == this.lists.length) {
              (await loading).dismiss();
              resolve(IENMessage.success);
            }
          }
        });

      } catch (error) {
        resolve(error.message);
      }
    });
  }

}
