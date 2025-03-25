import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { CUISaleProcess } from '../processes/cuiSale.process';
import { IENMessage } from 'src/app/models/base.model';
import { SaleReportPage } from '../sale-report/sale-report.page';
import { StockReportPage } from '../stock-report/stock-report.page';

@Component({
  selector: 'app-cui-sale',
  templateUrl: './cui-sale.page.html',
  styleUrls: ['./cui-sale.page.scss'],
})
export class CuiSalePage implements OnInit {

  @Input() machineId: string;
  @Input() otp: string;
  @Input() _l: Array<any>;

  private cuisaleProcess: CUISaleProcess;

  lists: Array<any> = [];

  constructor(
    public apiService: ApiService
  ) { 
    this.cuisaleProcess = new CUISaleProcess(this.apiService);
  }

  ngOnInit() {
    console.log(`_l der`, this._l);
    this.loadCUISaleList();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  loadCUISaleList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
      //  await this.cashingService.clear();
        const params = {
          machineId: this.machineId
        }
        console.log(`params`, params);
        const run = await this.cuisaleProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.lists = run.data[0].lists.data;
        console.log(`list`, this.lists);
        
        if (this.lists != undefined && this.lists.length > 0) {
          const instock = this.lists.filter(item => item.stock.id != -1);
          console.log(`instock`, instock);
          for(let i = 0; i < instock.length; i++) {
            for(let j = 0; j < this._l.length; j++) {
              if (instock[i].stock != '' && instock[i].stock.image == this._l[j].stock.imageUrl) {
                instock[i].stock.image = this._l[j].stock.image;
              }
            }
          }
          this.lists = instock;
        }
        console.log('test here', this.lists);
        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  saleRport() {
    const props = {
      machineId: this.machineId,
      otp: this.otp
    }
    this.apiService.showModal(SaleReportPage, props).then(r => {
      r.present();
    });
  }
  stockRport() {
    const props = {
      machineId: this.machineId,
      otp: this.otp
    }
    this.apiService.showModal(StockReportPage, props).then(r => {
      r.present();
    });
  }
}
