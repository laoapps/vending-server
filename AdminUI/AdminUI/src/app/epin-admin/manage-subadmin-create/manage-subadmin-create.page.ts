import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { CreateSubadminProcess } from '../processes/createSubadmin.process';
import { IENMessage } from 'src/app/models/base.model';

@Component({
  selector: 'app-manage-subadmin-create',
  templateUrl: './manage-subadmin-create.page.html',
  styleUrls: ['./manage-subadmin-create.page.scss'],
})
export class ManageSubadminCreatePage implements OnInit {

  @Input() manageSubadminPage: any;

  private createSubadminProcess: CreateSubadminProcess;

  phonenumber: string;

  constructor(
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) { 
    this.createSubadminProcess = new CreateSubadminProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

  createSubadmin(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {


        const params = {
          phonenumber: `+85620${this.phonenumber}`
        }
        const run = await this.createSubadminProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        const model = {
          id: run.data[0].id,
          phonenumber: this.phonenumber,
          provides: []
        }

        this.manageSubadminPage.autoUpdateAfterManageSubadminCreate(model);
        this.apiService.simpleMessage(IENMessage.createNewSubadminSuccess);
        this.phonenumber = '';

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
}
