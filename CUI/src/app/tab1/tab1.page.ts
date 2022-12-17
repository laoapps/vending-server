import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IMachineClientID, IMachineId, IMMoneyQRRes, IVendingMachineBill, IVendingMachineSale } from '../services/syste.model';
import { ModalController, Platform } from '@ionic/angular';
import { BarcodeScanner, BarcodeScannerOptions } from "@ionic-native/barcode-scanner/ngx";
import { QrpayPage } from '../qrpay/qrpay.page';
import qrlogo from 'qrcode-with-logos';
import { StocksalePage } from '../stocksale/stocksale.page';
import { IonicStorageService } from '../ionic-storage.service';
import { CachingService } from '../services/caching.service';
import { environment } from 'src/environments/environment';
import { ShowcartPage } from '../showcart/showcart.page';
var host = window.location.protocol + "//" + window.location.host;
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {

  mmLogo = 'assets/icon/mmoney.png';

  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();

  bills = {} as IVendingMachineBill;

  machineId = {} as IMachineId;

  url = environment.url;
  orders = new Array<IVendingMachineSale>();
  swidth = 0;
  sheight = 0;
  smode = 2;

  summarizeOrder = new Array<IVendingMachineSale>();
  getTotalSale = { q: 0, t: 0 };

  saleList = new Array<IVendingMachineSale>();
  timeoutHandler: any;
  count: any;
  compensation = 0;
  constructor(private ref: ChangeDetectorRef,
    public apiService: ApiService,
    platform: Platform,
    private scanner: BarcodeScanner,
    public storage: IonicStorageService,
    public appCaching: CachingService) {
    // alert('V1_'+this.mmLogo);      

    // ref.detach();
    // this.zone.runOutsideAngular(()=>{
    this.machineId = this.apiService.machineId;
    this.url = this.apiService.url;
    this.initDemo();

    platform.ready().then(() => {
      console.log('Width: ' + (this.swidth = platform.width()));
      console.log('Height: ' + (this.sheight = platform.height()));
      console.log('screen width', this.swidth, 'screen height', this.sheight);
      if (this.swidth > 550) this.smode = 3;
      else this.smode = 2;
      // setTimeout(() => {
      console.log('loading sale list');


      // }, 1000);
      this.vendingOnSale = this.apiService.vendingOnSale;
      this.vendingBillPaid = this.apiService.vendingBillPaid;
      this.vendingBill = this.apiService.vendingBill;
      this.onlineMachines = this.apiService.onlineMachines;

      this.apiService.wsapi.loginSubscription.subscribe(r => {
        if (!r) return console.log('empty')
        console.log('ws login subscription', r);
        this.apiService.clientId.clientId = r.clientId;
        this.apiService.wsAlive.time = new Date();
        this.apiService.wsAlive.isAlive = this.apiService.checkOnlineStatus();
        // this.loadSaleList();
      })
    });
    // });


  }
  refresh() {
    window.location.reload();
  }
  initDemo() {
    this.apiService.initDemo().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.storage.get('saleStock', 'stock').then(s => {

          const storage = s?.v as Array<IVendingMachineSale>;
          const sale = storage ? storage : [] as Array<IVendingMachineSale>;
          const saley = r.data as Array<IVendingMachineSale>;

          const arrdel = [];
          const arrnew = [];
          saley.forEach(v => {
            const x = sale.find(vs => vs.stock.id == v.stock.id);
            if (!x) {
              arrnew.push(v)
            } else {
              // console.log('update X', x);

              // Object.keys(v).forEach(k => {
              //   // if (Array.isArray(x[k])) {
              //   //   Object.keys(x[k]).forEach(j => {
              //   //     x[k][j] = v[k][j]
              //   //   })
              //   // } else
              //   x[k] = v[k];
              // })
              // console.log('update X1', x);
            };
          })

          sale.forEach(v =>
            !saley.find(vs => vs.stock.id == v.stock.id) ? arrdel.push(v) : '');

          if (arrnew.length)
            sale.push(...arrnew);
          if (arrdel.length)
            arrdel.forEach((v) => {
              const i = sale.findIndex(vx => vx.stock.id == v.stock.id);
              sale.splice(i, 1);
            })

          sale.sort((a, b) => {
            if (b.position - a.position) return -1;
          })

          this.vendingOnSale.push(...sale);
          this.saleList.push(...this.vendingOnSale);

          this.saleList.sort((a, b) => {
            if (a.position < b.position) return -1;
          })
          console.log(this.saleList);

          if (arrdel.length || arrnew.length)
            this.storage.set('saleStock', this.saleList, 'stock');

          if (this.saleList[0].position == 0) this.compensation = 1;
        })


        // window.location.reload();
      } else {
        alert(r.message)
      }
    })
  }
  endCount() {
    if (this.timeoutHandler) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
    if (this.count >= 3) {
      this.manageStock();
    }
    this.count = 0;
  }
  holdCount() {
    this.timeoutHandler = setInterval(() => {
      ++this.count;
    }, 1000);
  }
  async manageStock() {
    const x = prompt('password');
    console.log(x, this.getPassword());

    // if (!this.getPassword().endsWith(x) || x.length < 6) return;
    const m = await this.apiService.showModal(StocksalePage);
    m.onDidDismiss().then(r => {
      r.data;
      console.log('manageStock', r.data);
      if (r.data) {
        this.storage.set('saleStock', this.vendingOnSale, 'stock').then(r => {
          console.log('SAVE saleStock', r);
        }).catch(e => {
          console.log('Error', e);
        })
      } else {
        console.log('Canceled');

      }
      // window.location.reload();
    })
    m.present();

  }
  // loadPaidBills() {
  //   this.apiService.loadPaidBills().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingBillPaid.push(...r.data);
  //     }
  //   })
  // }
  // loadBills() {
  //   this.apiService.loadBills().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingBill.push(...r.data);
  //     }
  //   })
  // }
  loadOnlineMachine() {
    this.apiService.loadOnlineMachine().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.onlineMachines.push(...r.data);
      }
    })
  }
  // loadSaleList() {
  //   this.apiService.loadSaleList().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.vendingOnSale.length=0;
  //       this.saleList.length=0;
  //       this.vendingOnSale.push(...r.data);
  //       console.log('VENDING ON SALE', this.vendingOnSale);
  //       this.saleList.push(...this.getSaleList());
  //     }
  //   })
  // }

  buyMMoney(x: IVendingMachineSale) {
    if (!x) return alert('not found');
    // if (x.stock.qtty <= 0) alert('Out Of order');
    if (x.stock.price == 0) {
      this.apiService.getFreeProduct(x.position, x.stock.id).subscribe(r => {
        console.log(r);
        if (r.status) {
          this.apiService.toast.create({ message: r.message, duration: 2000 }).then(r => {
            r.present();
          })
        } else {
          this.apiService.toast.create({ message: r.message, duration: 5000 }).then(r => {
            r.present();
          })
        }
        this.apiService.dismissLoading();
      });
    } else {
      const amount = x.stock.price * 1;
      this.apiService.showLoading();
      this.apiService.buyMMoney([x], amount, this.machineId.machineId).subscribe(r => {
        console.log(r);
        if (r.status) {
          this.bills = r.data as IVendingMachineBill;
          localStorage.setItem('order', JSON.stringify(this.bills));
          new qrlogo({ logo: '../../assets/icon/mmoney.png', content: this.bills.qr }).getCanvas().then(r => {
            this.apiService.modal.create({ component: QrpayPage, componentProps: { encodedData: r.toDataURL(), amount, ref: this.bills.paymentref } }).then(r => {
              r.present();
            })
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
        } else {
          this.apiService.toast.create({ message: r.message, duration: 5000 }).then(r => {
            r.present();
          })
        }
        this.apiService.dismissLoading();
      })
    }

    this.orders = [];
    this.summarizeOrder = [];
  }
  buyManyMMoney() {
    if (!this.orders.length) return alert('Please add any items first');
    const amount = this.orders.reduce((a, b) => a + b.stock.price * b.stock.qtty, 0);
    // console.log('ids', this.orders.map(v => { return { id: v.stock.id + '', position: v.position } }));
    this.apiService.showLoading();
    console.log(this.orders, amount);
    this.apiService.buyMMoney(this.orders, amount, this.machineId.machineId).subscribe(r => {
      console.log(r);
      if (r.status) {
        this.bills = r.data as IVendingMachineBill;
        localStorage.setItem('order', JSON.stringify(this.bills));
        new qrlogo({ logo: '../../assets/icon/mmoney.png', content: this.bills.qr }).getCanvas().then(r => {
          this.apiService.modal.create({ component: QrpayPage, componentProps: { encodedData: r.toDataURL(), amount, ref: this.bills.paymentref } }).then(r => {
            r.present();
          })
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
      this.apiService.dismissLoading();
    });
    this.orders = [];
    this.summarizeOrder = [];
  }

  addOrder(x: IVendingMachineSale) {
    // this.zone.runOutsideAngular(() => {
    // const ord = this.orders.find(v=>v.stock.id==x.stock.id);
    if (this.orders.find(v => v.position == x.position)) {
      const mx = x.max;
      const summ = this.getSummarizeOrder();
      const re = summ.find(v => (v.stock.qtty + 1) > mx && v.position == x.position);
      console.log(summ, mx, re);
      if (re)
        return alert('Out of Stock');
    }
    if (x.stock.qtty < 1) return alert('Out of Stock');
    console.log('ID', x);
    if (!x) return alert('not found');
    // if (x.stock.qtty <= 0) alert('Out Of order');
    this.apiService.showLoading();
    const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
    y.stock.qtty = 1;
    console.log('y', y);

    this.orders.push(y);
    this.getSummarizeOrder();
    setTimeout(() => {
      this.apiService.dismissLoading();
    }, 1500);

    // });
  }
  getSummarizeOrder() {
    this.summarizeOrder.length = 0;
    const o = new Array<IVendingMachineSale>();
    this.orders.forEach(v => {
      const x = o.find(x => x.stock.id == v.stock.id);
      if (!x) o.push(JSON.parse(JSON.stringify(v)));
      else x.stock.qtty += 1
    })
    this.summarizeOrder.push(...o);
    const t = this.getTotal();
    Object.keys(this.getTotalSale).forEach(k => {
      this.getTotalSale[k] = t[k];
    })
    return this.summarizeOrder;
  }
  getTotal() {
    const o = this.summarizeOrder;
    const q = o.reduce((a, b) => { return a + b.stock.qtty }, 0);
    const t = o.reduce((a, b) => { return a + b.stock.qtty * b.stock.price }, 0);
    return { q, t };
  }
  // clearOrder() {
  //   this.orders.length = 0;
  //   this.getSummarizeOrder();
  // }


  getSaleList() {
    const x = new Array<Array<IVendingMachineSale>>();

    this.vendingOnSale.forEach((v, i) => {
      if (i == this.smode) {
        x.push(this.vendingOnSale.slice(0, i));
      } else if (!(i % this.smode)) {
        x.push(this.vendingOnSale.slice(i - this.smode, i))
      } else if (i == this.vendingOnSale.length - 1) {
        x.push(this.vendingOnSale.slice(this.vendingOnSale.length - this.smode))
      }

    })
    // console.log('x',x);

    return x;
  }
  handleRefresh(ev: any) {
    this.refresh();
  }
  showCart() {
    this.apiService.showModal(ShowcartPage, { orders: this.orders, compensation: this.compensation }).then(r => {
      r.present();
    })
  }
  getPassword() {
    let x = '';
    this.apiService.machineuuid.split('').forEach(v => {
      !Number.isNaN(Number.parseInt(v)) ? x += v : '';
    })
    return x;
  }
}
