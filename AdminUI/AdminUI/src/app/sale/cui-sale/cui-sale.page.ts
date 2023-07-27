import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { CUISaleProcess } from '../processes/cuiSale.process';
import { IENMessage } from 'src/app/models/base.model';

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
          for(let i = 0; i < instock.length; i++) {
            for(let j = 0; j < this._l.length; j++) {
              if (instock[i].stock != '' && instock[i].stock.image == this._l[j].stock.imageurl) {
                instock[i].stock.image = this._l[j].stock.image;
              }
            }
          }
          this.lists = instock;
        }

        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }


}
