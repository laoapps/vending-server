import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { AddProvideToSubadminProcess } from '../processes/addProvideToSubadmin.process';
import { IENMessage } from 'src/app/models/base.model';
import { RemoveProvideToSubadminProcess } from '../processes/removeProvideToSubadmin.process';

@Component({
  selector: 'app-manage-subadmin-info',
  templateUrl: './manage-subadmin-info.page.html',
  styleUrls: ['./manage-subadmin-info.page.scss'],
})
export class ManageSubadminInfoPage implements OnInit {

  @Input() manageSubadminPage: any;
  @Input() list: any;

  private addProvideToSubadminProcess: AddProvideToSubadminProcess;
  private removeProvideToSubadminProcess: RemoveProvideToSubadminProcess;

  constructor(
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) { 
    this.addProvideToSubadminProcess = new AddProvideToSubadminProcess(this.apiService, this.vendingAPIService);
    this.removeProvideToSubadminProcess = new RemoveProvideToSubadminProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

  addProvideToSubadmin(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const alert = this.apiService.alert.create({
          header: 'Add Provide',
          subHeader: 'Please enter machine id and imei',
          inputs: [
            {
              type: 'text',
              placeholder: 'Enter machine id',
              name: 'input_machineid'
            },
            {
              type: 'text',
              placeholder: 'Enter imei',
              name: 'input_imei'
            },
          ],
          buttons: [
            {
              text: 'Add',
              handler: async (data) => {
                const duplicate = this.list.provides.filter(item => item.machineId == data.input_machineid && item.imei == data.input_imei);

                if (duplicate != undefined && Object.entries(duplicate).length > 0) {
                  this.apiService.simpleMessage(IENMessage.thisMachineHasAlreadyAdded);
                  return;
                }
                const params = {
                  id: this.list.id,
                  phonenumber: this.list.phonenumber,
                  machineId: data.input_machineid,
                  imei: data.input_imei
                }
                let run: any = await this.addProvideToSubadminProcess.Init(params);
                if (run.message != IENMessage.success) {
                  this.apiService.simpleMessage(run);
                  return;
                }                

                this.list.provides.unshift(params);
                resolve(IENMessage.success);
              }
            },
            'Cancel'
          ]
        });
        (await alert).present();
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  removeProvideToSubadmin(list: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {


        const params = {
          id: this.list.id,
          phonenumber: this.list.phonenumber,
          machineId: list.machineId,
          imei: list.imei   
        }
        const run = await this.removeProvideToSubadminProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        
        this.list.provides = this.list.provides.filter(item => item.machineId != list.machineId && item.imei != list.imei);
        this.manageSubadminPage.autoUpdateAfterRemoveProvideFromSubadmin(this.list);
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

}
