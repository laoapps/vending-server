import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IMachineClientID, IMachineId, IMMoneyQRRes, IVendingMachineBill, IVendingMachineSale } from '../services/syste.model';
import { ModalController, Platform } from '@ionic/angular';
import { BarcodeScanner, BarcodeScannerOptions } from "@ionic-native/barcode-scanner/ngx";
import { QrpayPage } from '../qrpay/qrpay.page';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();

  bills = {} as IVendingMachineBill;

  machineId = {} as IMachineId;

  url = 'http://localhost:9009'
  orders = new Array<IVendingMachineSale>();
  swidth = 0;
  sheight = 0;
  smode = 2;
  constructor(public apiService: ApiService, platform: Platform, private scanner: BarcodeScanner, public modal: ModalController) {
    this.machineId = this.apiService.machineId;
    this.url = this.apiService.url
    this.initDemo();
    this.loadSaleList();
    platform.ready().then(() => {
      console.log('Width: ' + (this.swidth = platform.width()));
      console.log('Height: ' + (this.sheight = platform.height()));
      console.log('screen width', this.swidth, 'screen height', this.sheight);
      if (this.swidth > 550) this.smode = 3;
      else this.smode = 2;
    });

  }
  initDemo() {
    this.apiService.initDemo().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.vendingOnSale = r.data;
      }
    })
  }
  loadPaidBills() {
    this.apiService.loadPaidBills().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.vendingBillPaid = r.data;
      }
    })
  }
  loadBills() {
    this.apiService.loadBills().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.vendingBill = r.data;
      }
    })
  }
  loadOnlineMachine() {
    this.apiService.loadOnlineMachine().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.onlineMachines = r.data;
      }
    })
  }
  loadSaleList() {
    this.apiService.loadSaleList().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.vendingOnSale = r.data;
      }
    })
  }
  buyMMoney(id: string) {
    const x = this.vendingOnSale.find(v => v.stock.id+'' == id+'');
    if (!x) return alert('not found');
    const amount =this.orders.map(v => v.stock.price).reduce((a, b) => a + b, 0);
    this.apiService.buyMMoney([id+''], amount, this.machineId.machineId).subscribe(r => {
      console.log(r);
      if (r.status) {
        this.bills = r.data as IVendingMachineBill;
        localStorage.setItem('order', JSON.stringify(this.bills));
        this.modal.create({ component: QrpayPage, componentProps: { encodedData: this.bills.qr,amount} }).then(r => {
          r.present();
        })
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
    })
  }
  buyManyMMoney() {
    if (!this.orders.length) alert('Please add any items first');
    const amount =this.orders.map(v => v.stock.price).reduce((a, b) => a + b, 0);
    this.apiService.buyMMoney([...new Set(this.orders.map(v => v.id+''))], amount, this.machineId.machineId).subscribe(r => {
      console.log(r);
      if (r.status) {
        this.bills = r.data as IVendingMachineBill;
        localStorage.setItem('order', JSON.stringify(this.bills));
        this.modal.create({ component: QrpayPage, componentProps: { encodedData: this.bills.qr,amount } }).then(r => {
          r.present();
        })
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
    })
  }

  addOrder(id: string) {
    console.log('ID', id);

    if (!id) return alert('add error')
    const x = this.vendingOnSale.find(v => v.stock.id+'' == id+'');
    if (!x) return alert('not found');
    const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
    y.stock.qtty = 1;
    console.log('y', y, id);

    this.orders.push(y);
  }
  summarizeOrder() {
    const o = new Array<IVendingMachineSale>();
    this.orders.forEach(v => {
      const x = o.find(x => x.stock.id == v.stock.id);
      if (!x) o.push(JSON.parse(JSON.stringify(v)));
      else x.stock.qtty += 1
    })
    return o;
  }
  getSaleList() {
    const x = new Array<Array<IVendingMachineSale>>();
    this.vendingOnSale.forEach((v, i) => {
      const y = i + 1;
      if (!(y % this.smode)) x.push(this.vendingOnSale.slice(i - this.smode, i))
    })
    // console.log('x',x);

    return x;
  }


}
