import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ICurrentCard, IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import * as QRCode from 'qrcode';
import { MerchantCoinTransferProcess } from 'src/app/myaccount/processes/merchantCoinTransfer.process';
import { VendingLimiterCoinTransferProcess } from 'src/app/myaccount/processes/vendingLimiterCoinTransfer.process';
import { CoinTransferBillPage } from '../coin-transfer-bill/coin-transfer-bill.page';
import { VendingAPIService } from 'src/app/services/vending-api.service';

@Component({
  selector: 'app-cqr-payment',
  templateUrl: './cqr-payment.page.html',
  styleUrls: ['./cqr-payment.page.scss'],
})
export class CqrPaymentPage implements OnInit {

  merchantCoinTransferProcess: MerchantCoinTransferProcess;
  vendingLimiterCoinTransferProcess: VendingLimiterCoinTransferProcess;
  
  @Input() type: string;
  @Input() mode: string;
  @Input() sender: string;
  @Input() receiver: string;
  @Input() amount: number;
  @Input() expire: string;
  @Input() options: any;
  
  moneyList = [100, 1000, 5000, 10000, 20000, 50000, 100000, 150000, 200000, 500000, 1000000, 2000000, 5000000];
  sendingAmount: number = 0;
  sendercoinbalance: number;
  description: string;
  coinListId: string;
  coinCode: string;

  constructor(
    private toast: ToastController,
    private modal: ModalController,
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) {
    this.merchantCoinTransferProcess = new MerchantCoinTransferProcess(this.apiService, this.vendingAPIService);
    this.vendingLimiterCoinTransferProcess = new VendingLimiterCoinTransferProcess(this.apiService, this.vendingAPIService);
  }

  ngOnInit() {
    this.sendingAmount = this.amount;
    this.coinListId = this.options.name.split('_')[0];
    this.coinCode = this.options.name.split('_')[3];

    if (this.coinListId != this.apiService.ownerCoinListId && this.coinCode != this.apiService.ownerCoinCode) {
      this.apiService.simpleMessage(IENMessage.thisCQRIsNotVendingCoin);
      this.apiService.modal.dismiss();
      return;
    }

    if (this.apiService.currentcard == ICurrentCard.merchantCoinCard) {
      this.sendercoinbalance = this.apiService.merchanteCoinBalance;
    } else if (this.apiService.currentcard == ICurrentCard.vendingLimtierCoinCard) {
      this.sendercoinbalance = this.apiService.vendingLimiterCoinBalance;
    }

    this.activeFormTransfer();

  }

  activeFormTransfer() {
    (document.querySelector('.form-transfer') as HTMLElement).classList.add('active');
    (document.querySelector('.form-description') as HTMLElement).classList.remove('active');
    this.description = undefined;
  }
  activeFormDescription() {
    if (!this.validateEmpty_reciver_amont()) return;
    (document.querySelector('.form-transfer') as HTMLElement).classList.remove('active');
    (document.querySelector('.form-description') as HTMLElement).classList.add('active');
  }
  
  validateEmpty_reciver_amont(): boolean {
    if (!(this.sender && this.receiver)) {
      this.toast.create({ message: 'parameters of sender and receiver unmatch', duration: 1000 }).then(r => r.present());
      this.modal.dismiss();
      return false;
    }
    if (!(this.sendingAmount)) {
      this.toast.create({ message: 'Please enter amount', duration: 1000 }).then(r => r.present());
      return false;
    }
    if (this.sender == this.receiver) {
      this.toast.create({ message: 'transfer fail', duration: 1000 }).then(r => r.present());
      return false;
    }
    if (this.sendercoinbalance < this.sendingAmount) {
      this.toast.create({ message: 'Your balance is not enought', duration: 1000 }).then(r => r.present());
      return false;
    }

    return true;
  }

  getMoney(amount: number) {
    this.sendingAmount = amount;
  }

  close() {
    this.modal.dismiss();
  }

  transfer(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        console.log(this.sender, this.receiver, this.sendingAmount, this.description);
        if (!(this.sender && this.receiver && this.sendingAmount && this.description)) throw new Error(IENMessage.parametersEmpty);

        if (this.apiService.currentcard == ICurrentCard.merchantCoinCard) {
          if (this.apiService.merchanteCoinBalance < this.amount) throw new Error(IENMessage.yourBalanceIsNotEnought);

          const params = {
            ownerUuid: this.apiService.ownerUuid,
            sender: this.sender,
            receiver: this.receiver,
            amount: this.amount,
            description: this.description,
            coinListId: this.coinListId,
            coinCode: this.coinCode,
            limitBlock: 10
          }
          console.log(`params`, params);

          const run = await this.merchantCoinTransferProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run);

          this.apiService.merchanteCoinBalance = this.apiService.merchanteCoinBalance - this.amount;
          if (this.apiService.vendingLimiterUUID == this.receiver) {
            this.apiService.vendingLimiterCoinBalance = Number(this.apiService.vendingLimiterCoinBalance) + this.amount;
          }

          this.apiService.modal.create({ component: CoinTransferBillPage, componentProps: { myBill: run.data[0].myBill } }).then(r => {
            r.present();
            this.modal.dismiss();
            r.onDidDismiss().then(() => resolve(IENMessage.success));
          });

        } else if (this.apiService.currentcard == ICurrentCard.vendingLimtierCoinCard) {
          if (this.apiService.vendingLimiterCoinBalance < this.amount) throw new Error(IENMessage.yourBalanceIsNotEnought);

          const params = {
            ownerUuid: this.apiService.ownerUuid,
            sender: this.sender,
            receiver: this.receiver,
            amount: this.amount,
            description: this.description,
            coinListId: this.coinListId,
            coinCode: this.coinCode,
            limitBlock: 10
          }

          const run = await this.vendingLimiterCoinTransferProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run);

          this.apiService.vendingLimiterCoinBalance = this.apiService.vendingLimiterCoinBalance - this.amount;
          if (this.apiService.merchantUUID == this.receiver) {
            this.apiService.merchanteCoinBalance = Number(this.apiService.merchanteCoinBalance) + this.amount;
          }
          this.apiService.modal.create({ component: CoinTransferBillPage, componentProps: { myBill: run.data[0].myBill } }).then(r => {
            r.present();
            this.modal.dismiss();
            r.onDidDismiss().then(() => resolve(IENMessage.success));
          });
          
        } else {
          throw new Error(IENMessage.youHaveNoCardUsingNow);
        }

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  async presentAlertGenQrCode(header: string, money: string, myQRCode: string) {
    QRCode.toDataURL(myQRCode).then(async r => {
      const alert = await this.apiService.alert.create({
        cssClass: 'transfer-qrcode-alert',
        header: this.numberWithCommas(money),
        subHeader: header,
        message: `<img src="${r}" alt="g-maps" class="silver" style="border-radius: 2px; width: 10px; height: 10px;">`,

        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            id: 'cancel-button',
            handler: (blah) => {
              this.modal.dismiss();
            }
          }, {
            text: 'Okay',
            id: 'confirm-button',
            handler: () => {
              this.modal.dismiss();
            }
          }
        ]
      });

      await alert.present();
    })
  }

  public numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}
