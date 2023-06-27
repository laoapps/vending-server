import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LaabApiService } from 'src/app/services/laab-api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { LoadDefaultProcess } from './processes/loadDefault.process';
import { IENMessage } from 'src/app/models/base.model';
import { CqrScanPage } from './shares/components/cqr-scan/cqr-scan.page';

@Component({
  selector: 'app-machine-wallet',
  templateUrl: './machine-wallet.page.html',
  styleUrls: ['./machine-wallet.page.scss'],
})
export class MachineWalletPage implements OnInit {

  @Input() s: any;

  private loadDefaultProcess: LoadDefaultProcess;
  
  initState: boolean = false;

  child_coinTransferComponent: boolean = false;
  child_CQRComponent: boolean = false;
  child_reportOptionsComponent: boolean = false;
  child_counterComponent: boolean = false;

  constructor(
    public apiService: ApiService,
    private laabAPIService: LaabApiService,
    private vendingAPIService: VendingAPIService
  ) { 
    this.loadDefaultProcess = new LoadDefaultProcess(this.apiService, this.vendingAPIService);
  }


  async ngOnInit() {
    await this.loadDefault();
  }
  close() {
    this.apiService.currentcard = '';
    this.apiService.closeModal()
  }

  loadDefault(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {


        let params: any = {
          ownerUuid: this.apiService.ownerUuid,
          machineId: this.apiService.currentMachineId
        }

        const run = await this.loadDefaultProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        

        this.apiService.currentVendingWalletUUID = run.data[0].vendingWalletUUID;
        this.apiService.currentVendingWalletCoinName = run.data[0].vendingWalletCoinName;
        this.apiService.currentVendingWalletCoinBalance = run.data[0].vendingWalletCoinBalance;
        this.initState = true;

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.apiService.closeModal();
        resolve(error.message);
      }
    });
  }

  switchMenu(component: string): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let loading = this.apiService.load.create({ message: 'loading...' });
        (await loading).present();
        setTimeout(async () => {
          (await loading).dismiss();

                  
          if (component == 'coin-transfer') {
            this.child_coinTransferComponent = true;
            this.child_CQRComponent = false;
            this.child_reportOptionsComponent = false;
            this.child_counterComponent = false;
          } else if (component == 'cmcqr') {
            this.child_coinTransferComponent = false;
            this.child_CQRComponent = true;
            this.child_reportOptionsComponent = false;
            this.child_counterComponent = false;
          } else if (component == 'cqr-scan') {
            this.apiService.modal.create({ component: CqrScanPage, componentProps: {} }).then(r => r.present());
          } else if (component == 'report-options') {
            this.child_coinTransferComponent = false;
            this.child_CQRComponent = false;
            this.child_reportOptionsComponent = true;
            this.child_counterComponent = false;
          } else if (component == 'counter') {
            this.child_coinTransferComponent = false;
            this.child_CQRComponent = false;
            this.child_reportOptionsComponent = false;
            this.child_counterComponent = true;
          }

          resolve(IENMessage.success);

        }, 100);

      } catch (error) {
       resolve(error.message); 
      }
    });
  }











  substringid() {
    return '*** *** *** ' + this.apiService.ownerUuid.substring(this.apiService.ownerUuid.length - 3, this.apiService.ownerUuid.length);
  }
}
