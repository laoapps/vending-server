import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ICurrentCard, IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as QRCode from 'qrcode';
import { ShowQrhashVerifyPage } from '../show-qrhash-verify/show-qrhash-verify.page';
import { TextHashVerifyProcess } from '../../../processes/textHashVerify.process';
import { QRHashVerifyProcess } from '../../../processes/qrHashVerify.process';

@Component({
  selector: 'app-hash-verify',
  templateUrl: './hash-verify.page.html',
  styleUrls: ['./hash-verify.page.scss'],
})
export class HashVerifyPage implements OnInit {

  private textHashVerifyProcess: TextHashVerifyProcess;
  private qrHashVerifyProcess: QRHashVerifyProcess;

  @Input() sender: string;
  @Input() hashM: string;
  @Input() info: string;
  @Input() balanceType: string;
  @Input() verifymode: string;
  @Input() description: string;

  lists: Array<any> = [];
  chains: any = {};
  type: string;
  current_amount: number;
  last_amount: number;
  sender_uuid: string;
  receiver_uuid: string;
  income_expend_amount: number;
  balanceTypeFromQR: string;

  constructor(
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService,
    private modal: ModalController
  ) { 
    this.textHashVerifyProcess = new TextHashVerifyProcess(this.apiService, this.vendingAPIService);
    this.qrHashVerifyProcess = new QRHashVerifyProcess(this.apiService, this.vendingAPIService);
  }

  async ngOnInit() {
    if (this.verifymode == 'text') {
      await this.loadTextHashVerify();
    } else if (this.verifymode == 'qr') {
      await this.loadQRHashVerify();
    } else {
      this.apiService.simpleMessage(IENMessage.invalidVerifyMode);
      this.modal.dismiss();
    }
  }

  loadTextHashVerify(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let params: any = {
          ownerUuid: this.apiService.ownerUuid,
          machineId: this.apiService.currentMachineId,
          sender: this.sender,
          hashM: this.hashM,
          info: this.info
        }
        console.log(`params`, params);
        const run = await this.textHashVerifyProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.setDetail(run);

        resolve(IENMessage.success);
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.modal.dismiss();
        resolve(error.message);
      }
    });
  }

  loadQRHashVerify(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let params: any = {
          ownerUuid: this.apiService.ownerUuid,
          machineId: this.apiService.currentMachineId,
          sender: this.sender,
          hashM: this.hashM,
          info: this.info,
          QRMode: 'use'
        }
        console.log(`params`, params);
        params.QRMode = 'use';
        const run = await this.qrHashVerifyProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

          this.setDetail(run);

        resolve(IENMessage.success);
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.modal.dismiss();
        resolve(error.message);
      }
    });
  }

  private setDetail(run: any) {
    const text = run.data[0].result.result;
    this.lists = Object.values(text);
    this.chains.block1 = this.lists[0].h0;
    this.chains.block2 = this.lists[1].h0;
    this.chains.block3 = this.lists[2].h0;
    this.chains.block4 = this.lists[3].h0;
    this.chains.block5 = this.lists[4].h0;
    this.chains.block6 = this.lists[5].h0;

    this.current_amount = run.data[0].result.current_amount;
    this.last_amount = run.data[0].result.last_amount;
    this.sender_uuid = run.data[0].result.sender;
    this.receiver_uuid = run.data[0].result.receiver;
    this.description = run.data[0].result.description ? run.data[0].result.description : this.description;

    if (this.balanceType == undefined) {
      if (run.data[0].result.income_amount != undefined && Object.entries(run.data[0].result.income_amount).length > 0) {
        this.balanceType = 'coin_income';
      } else {
        this.balanceType = 'coin_expend';
      }
    } else {
      this.type = run.data[0].result.type ? run.data[0].result.type : this.balanceType;
    }

    if (this.balanceType == 'coin_income') {

      this.income_expend_amount = run.data[0].result.income_amount;
      this.type = this.type + ' ' + `(Income)`;

    } else if (this.balanceType == 'coin_expend') {

      this.income_expend_amount = run.data[0].result.expend_amount;
      this.type = this.type + ' ' + `(Expend)`;
    } else if (this.balanceType == 'smc_coupon_coin_expend') {
      this.income_expend_amount = run.data[0].result.smc_detail.amount;
      this.current_amount = run.data[0].result.smc_detail.current_amount;
      this.last_amount = run.data[0].result.smc_detail.last_amount;

    }
  }

  close() {
    this.modal.dismiss();
  }

  ShorteningString(s: string) {
    if (s.length > 10) {
      const f = s.substring(0, 10);
      const e = s.substring(s.length - 10, s.length);
      s = f + ' ... ' + e;
    }
    return s;
  }
  ShowFullHash(noHash: string, s: string) {
    this.presentAlert(noHash, s);
  }
  ShowMergeFullHash(noHash: string, s: string, s2: string) {
    this.presentMergeAlert(noHash, s, s2);
  }
  async presentMergeAlert(Nohash: string, FullHash1: string, fullHash2: string) {
    const text = `${FullHash1}\n ${fullHash2}`;
    const alert = await this.apiService.alert.create({
      cssClass: 'my-custom-class',
      header: 'Hash',
      message: text,
      buttons: ['OK'],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }
  async presentAlert(Nohash: string, FullHash: string) {

    const alert = await this.apiService.alert.create({
      cssClass: 'my-custom-class',
      header: 'Hash',
      message: FullHash,
      buttons: ['OK'],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }
  genQRcode() {
    this.genQR(JSON.stringify({hash:this.hashM,info:this.info}));
  }
  async genQR(x: string) {
    console.log(`rrrr`, x);

    if (x) {
      QRCode.toDataURL(x).then(async r => {

        this.apiService.modal.create({ component: ShowQrhashVerifyPage, componentProps: { qrImage: r, type: this.type } }).then(r => {
          r.present();
        });

      }).catch(e => {
        console.log(e);
      })

    }
  }
}
