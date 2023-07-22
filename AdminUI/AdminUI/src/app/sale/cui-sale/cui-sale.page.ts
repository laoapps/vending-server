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

        this.lists.sort((a, b) => {
          if (a.position < b.position) return -1;
          return 1;
        });
        console.log(`sort list`, this.lists);
        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }


}
