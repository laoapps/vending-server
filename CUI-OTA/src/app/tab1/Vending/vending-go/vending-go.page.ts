import { Component, Input, OnInit } from '@angular/core';
import { QrpayPage } from 'src/app/qrpay/qrpay.page';
import { ApiService } from 'src/app/services/api.service';
import { EClientCommand, IVendingMachineBill } from 'src/app/services/syste.model';
import { LaabGoPage } from '../../LAAB/laab-go/laab-go.page';
import * as cryptojs from 'crypto-js';
import { IENMessage } from 'src/app/models/base.model';
import qrlogo from 'qrcode-with-logos';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-vending-go',
    templateUrl: './vending-go.page.html',
    styleUrls: ['./vending-go.page.scss'],
    standalone: false
})
export class VendingGoPage implements OnInit {

  @Input() summarizeOrder: Array<any>;
  @Input() getTotalSale: any;
  @Input() bills: any;
  @Input() machineId: any;
  @Input() orders: Array<any>;

  quantity: number = 0;
  total: number = 0;

  constructor(
    private modal: ModalController,
    public apiService: ApiService,
  ) {
    this.apiService.___VendingGoPage = this.modal;

  }

  ngOnInit() {
    this.apiService.autopilot.auto = 0;
    this.summarizeOrder = JSON.parse(JSON.stringify(this.orders));
    this.summarizeOrder.forEach((item) => (item.stock.image = ''));

    for (let i = 0; i < this.summarizeOrder.length; i++) {
      this.quantity += this.summarizeOrder[i].stock.qtty;
      this.total +=
        this.summarizeOrder[i].stock.qtty *
        this.summarizeOrder[i].stock.price;
    }

    console.log(`sum total`, this.total);
    console.log(`summarizeOrder`, this.summarizeOrder);

    this.apiService.vendingGoPageSound()
  }

  buyManyMMoney() {
    // if (!this.orders.length) return alert('Please add any items first');
    // const amount = this.orders.reduce(
    //   (a, b) => a + b.stock.price * b.stock.qtty,
    //   0
    // );
    // this.apiService.showLoading();
    // console.log(this.orders, amount);
    // this.apiService
    //   .buyMMoney(this.orders, amount, this.machineId.machineId)
    //   .subscribe((r) => {
    //     console.log(r);
    //     if (r.status) {
    //       this.bills = r.data as IVendingMachineBill;
    //       localStorage.setItem('order', JSON.stringify(this.bills));
    //       new qrlogo({
    //         logo: '../../assets/icon/mmoney.png',
    //         content: this.bills.qr,
    //       })
    //         .getCanvas()
    //         .then((r) => {
    //           this.apiService.modal
    //             .create({
    //               component: QrpayPage,
    //               componentProps: {
    //                 encodedData: r.toDataURL(),
    //                 amount,
    //                 ref: this.bills.paymentref,
    //               },
    //               cssClass: 'dialog-fullscreen',
    //             })
    //             .then((r) => {
    //               r.present();

    //               this.apiService.soundMmoneyPaymentMethod();
    //             });
    //         });
    //       // this.scanner.encode(this.scanner.Encode.TEXT_TYPE, this.bills.qr).then(
    //       //   res => {
    //       //     console.log(res);
    //       //     this.modal.create({ component: QrpayPage, componentProps: { encodedData: res } }).then(r => {
    //       //       r.present();
    //       //     })
    //       //   }, error => {
    //       //     alert(error);
    //       //   }
    //       // );
    //     }
    //     this.apiService.dismissLoading();
    //     this.getTotalSale.q = 0;
    //     this.getTotalSale.t = 0;
    //     this.orders = [];
    //     this.summarizeOrder = [];
    //   });
  }


  buyManyLaoQR() {
    if (!this.orders.length) return alert('Please add any items first');
    const amount = this.orders.reduce(
      (a, b) => a + b.stock.price * b.stock.qtty,
      0
    );
    this.apiService.showLoading();
    console.log(this.orders, amount);
    this.apiService
      .buyLaoQR(this.orders, amount, this.machineId.machineId)
      .subscribe((r) => {
        console.log(r);
        if (r.status) {
          this.bills = r.data as IVendingMachineBill;
          localStorage.setItem('order', JSON.stringify(this.bills));
          new qrlogo({
            logo: '../../assets/icon/mmoney.png',
            content: this.bills.qr,
          })
            .getCanvas()
            .then((r) => {
              this.apiService.modal
                .create({
                  component: QrpayPage,
                  componentProps: {
                    encodedData: r.toDataURL(),
                    amount,
                    ref: this.bills.paymentref,
                  },
                  cssClass: 'dialog-fullscreen',
                })
                .then((r) => {
                  r.present();

                  this.apiService.soundMmoneyPaymentMethod();
                });
            });
          // this.scanner.encode(this.scanner.Encode.TEXT_TYPE, this.bills.qr).then(
          //   res => {
          //     console.log(res);
          //     this.modal.create({ component: QrpayPage, componentProps: { encodedData: res } }).then(r => {
          //       r.present();
          //     })
          //   }, error => {
          //     alert(error);
          //   }
          // );
        }
        this.apiService.dismissLoading();
        this.getTotalSale.q = 0;
        this.getTotalSale.t = 0;
        this.orders = [];
        this.summarizeOrder = [];
      });
  }

  laabGo(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        if (this.apiService.cash.amount < this.total) {
          throw new Error(IENMessage.notEnoughtCashBalance);
        }
        const sum_refund = this.apiService.cash.amount - this.total;

        const paidLAAB = {
          command: EClientCommand.paidLAAB,
          data: {
            ids: this.summarizeOrder,
            value: this.total,
            clientId: this.apiService.clientId.clientId,
          },
          ip: '',
          time: new Date().toString(),
          token: cryptojs
            .SHA256(
              this.apiService.machineId.machineId +
              this.apiService.machineId.otp
            )
            .toString(cryptojs.enc.Hex),
        };

        const props = {
          machineId: localStorage.getItem('machineId'),
          cash: this.apiService.cash.amount,
          quantity: this.quantity,
          total: this.total,
          balance: sum_refund,
          paidLAAB: paidLAAB,
          vendingGoPage: this.modal
        };
        console.log(`props`, props);

        this.apiService.modal
          .create({ component: LaabGoPage, componentProps: props })
          .then((r) => {
            r.present();
            this.apiService.soundLaabPaymentMethod();
          });
      } catch (error) {
        await this.apiService.soundPleaseTopUpValue();
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  close() {
    this.apiService.modal.dismiss();
  }

}
