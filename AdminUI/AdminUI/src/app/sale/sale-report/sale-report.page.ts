import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LoadVendingMachineSaleBillReportProcess } from '../processes/loadVendingMachineBillReport.process';

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


  beginDate: string;
  revertDate: string;


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
    this.beginDate = undefined;
    this.revertDate = undefined;
  }

  process(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let params: any = {} as any;
        if (this.datetimeCustom = true) {
          params = {
            beginDate: this.beginDate,
            revertDate: this.beginDate
          }
        } else {
          params = {
            beginDate: this.beginDate,
            revertDate: this.revertDate
          }
        }

        const run = await this.loadVendingMachineSaleBillReportProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        
        this.display = true;
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }
}
