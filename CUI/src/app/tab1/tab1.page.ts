import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IBillProcess, IMachineClientID, IMachineId, IMMoneyQRRes, IStock, IVendingMachineBill, IVendingMachineSale } from '../services/syste.model';
import { ModalController, Platform } from '@ionic/angular';
// import { BarcodeScanner, BarcodeScannerOptions } from "@ionic-native/barcode-scanner/ngx";
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

  private loadVendingWalletCoinBalanceProcess: LoadVendingWalletCoinBalanceProcess;
  private cashValidationProcess: CashValidationProcess;
  private cashinValidationProcess: CashinValidationProcess;

  acceptcash: number;




  production = environment.production;
  audio = new Audio('assets/khopchay.mp3');

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
  manageStockCount = 0;
  compensation = 0;

  constructor(private ref: ChangeDetectorRef,
    public apiService: ApiService,
    platform: Platform,
    // private scanner: @ionic-native/serial,
    public storage: IonicStorageService,
    public appCaching: CachingService,
    private vendingAPIService: VendingAPIService
    ) 
    { 

      this.loadVendingWalletCoinBalanceProcess = new LoadVendingWalletCoinBalanceProcess(this.apiService, this.vendingAPIService);
      this.cashValidationProcess = new CashValidationProcess(this.apiService, this.vendingAPIService);
      this.cashinValidationProcess = new CashinValidationProcess(this.apiService, this.vendingAPIService);

      this.initVendingWalletCoinBalance().then(() => {});
      // alert('V1_'+this.mmLogo);      

      // ref.detach();
      // this.zone.runOutsideAngular(()=>{
      this.machineId = this.apiService.machineId;
      this.url = this.apiService.url;
      // this.initVendingSale();


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
            this.initStock();
          })


        });
      // });

      this.apiService.onDeductOrderUpdate((position) => {
        try {
          const ind = this.orders.findIndex(v => v.position == position);
          if (ind != -1)
            this.orders.splice(ind, 1);
        } catch (error) {
          console.log(' error on event emitter');
        }

      });



  }

  refresh() {
    window.location.reload();
  }
  initStock() {


    this.apiService.loadVendingSale().subscribe(r => {
      console.log(r);
      if (r.status) {
        const saleServer = r.data as Array<IVendingMachineSale>;
        console.log('saleServer', saleServer);

        this.apiService.newStockItems(saleServer);
        
        // window.location.reload();
        this.storage.get('saleStock', 'stock').then(s => {
          const saleitems = JSON.parse(JSON.stringify(s?.v ? s.v : [])) as Array<IVendingMachineSale>;
          this.saleList.sort((a, b) => {
            if (a.position < b.position) return -1;
          });
          this.vendingOnSale.push(...saleitems);
          this.saleList.push(...this.vendingOnSale);
          if (this.saleList[0]?.position == 0) this.compensation = 1;
         
        })
      } else {
        alert(r.message)
      }
    })
  }
  // initStock() {

  //   this.saleList.length > 0
  //     ||
  //     this.apiService.loadVendingSale().subscribe(r => {
  //       console.log(r);
  //       if (r.status) {
  //         this.storage.get('stockitems_', 'item').then(rx => {
  //           const items = JSON.parse(JSON.stringify(rx?.v ? rx?.v : [])) as Array<IStock>;
  //           const sitems = items ? items : [];
  //           this.storage.get('saleStock', 'stock').then(s => {
  //             console.log('stock', s);

  //             const saleitems = JSON.parse(JSON.stringify(s?.v ? s.v : [])) as Array<IVendingMachineSale>;
  //             const saleStorage = saleitems ? saleitems : [] as Array<IVendingMachineSale>;
  //             const saleServer = r.data as Array<IVendingMachineSale>;

  //             const arrdel = [] as Array<IVendingMachineSale>;;
  //             const arrnew = [] as Array<IVendingMachineSale>;;
  //             if (!saleStorage.length) {
  //               saleServer.forEach(v => !saleStorage.find(vs => vs.stock.id == v.stock.id) ? arrnew.push(v) : '');
  //               saleStorage.forEach(v => !saleServer.find(vs => vs.stock.id == v.stock.id) ? arrdel.push(v) : '');

  //               if (arrnew.length)
  //                 saleStorage.push(...arrnew);
  //               if (arrdel.length)
  //                 arrdel.forEach((v) => {
  //                   const i = saleStorage.findIndex(vx => vx.stock.id == v.stock.id);
  //                   saleStorage.splice(i, 1);
  //                 })

  //               saleStorage.sort((a, b) => {
  //                 if (b.position < a.position) return -1;
  //               })
  //               console.log(saleStorage);
  //               this.vendingOnSale.push(...saleStorage);
  //               console.log(this.vendingOnSale);
  //               this.saleList.push(...this.vendingOnSale);

  //               this.saleList.sort((a, b) => {
  //                 if (a.position < b.position) return -1;
  //               })
  //               console.log(this.saleList);

  //               if (arrdel.length || arrnew.length)
  //                 this.storage.set('saleStock', this.saleList, 'stock');



  //               this.apiService.createStockItems(this.vendingOnSale);
  //             } else {
  //               saleServer.forEach(v => !sitems.find(vs => vs.id == v.stock.id) ? arrnew.push(v) : '');
  //               saleStorage.forEach(v => !sitems.find(vs => vs.id == v.stock.id) ? arrdel.push(v) : '');

  //               if (arrnew.length)
  //                 sitems.push(...arrnew.map(v => v.stock));
  //               if (arrdel.length)
  //                 arrdel.forEach((v) => {
  //                   const i = sitems.findIndex(vx => vx.id == v.stock.id);
  //                   saleStorage.splice(i, 1);
  //                 })
  //               this.apiService.updateStockItems(sitems);

  //               saleStorage.sort((a, b) => {
  //                 if (b.position < a.position) return -1;
  //               })
  //               console.log(saleStorage);
  //               this.vendingOnSale.push(...saleStorage);
  //               console.log(this.vendingOnSale);
  //               this.saleList.push(...this.vendingOnSale);

              this.saleList.sort((a, b) => {
                if (a.position < b.position) return -1;
              })
              console.log(this.saleList);
            }
            if (this.saleList[0].position == 0) this.compensation = 1;
          })
        })
        // window.location.reload();
      } else {
        alert(r.message)
      }
    })
  }
  initDemo() {
    this.apiService.initDemo().subscribe(r => {
      console.log(r);
      if (r.status) {
        this.storage.get('stockitems_', 'item').then(rx => {
          const items = JSON.parse(JSON.stringify(rx?.v ? rx?.v : [])) as Array<IStock>;
          const sitems = items ? items : [];
          this.storage.get('saleStock', 'stock').then(s => {
            console.log('stock', s);

            const saleitems = JSON.parse(JSON.stringify(s?.v ? s.v : [])) as Array<IVendingMachineSale>;
            const saleStorage = saleitems ? saleitems : [] as Array<IVendingMachineSale>;
            const saleServer = r.data as Array<IVendingMachineSale>;

            const arrdel = [] as Array<IVendingMachineSale>;;
            const arrnew = [] as Array<IVendingMachineSale>;;
            if (!saleStorage.length) {
              saleServer.forEach(v => !saleStorage.find(vs => vs.stock.id == v.stock.id) ? arrnew.push(v) : '');
              saleStorage.forEach(v => !saleServer.find(vs => vs.stock.id == v.stock.id) ? arrdel.push(v) : '');

              if (arrnew.length)
                saleStorage.push(...arrnew);
              if (arrdel.length)
                arrdel.forEach((v) => {
                  const i = saleStorage.findIndex(vx => vx.stock.id == v.stock.id);
                  saleStorage.splice(i, 1);
                })

  //             saleStorage.sort((a, b) => {
  //               if (b.position < a.position) return -1;
  //             })
  //             console.log(saleStorage);
  //             this.vendingOnSale.push(...saleStorage);
  //             console.log(this.vendingOnSale);
  //             this.saleList.push(...this.vendingOnSale);

  //             this.saleList.sort((a, b) => {
  //               if (a.position < b.position) return -1;
  //             })
  //             console.log(this.saleList);

  //             if (arrdel.length || arrnew.length)
  //               this.storage.set('saleStock', this.saleList, 'stock');



  //             this.apiService.createStockItems(this.vendingOnSale);
  //           } else {
  //             saleServer.forEach(v => !sitems.find(vs => vs.id == v.stock.id) ? arrnew.push(v) : '');
  //             saleStorage.forEach(v => !sitems.find(vs => vs.id == v.stock.id) ? arrdel.push(v) : '');

  //             if (arrnew.length)
  //               sitems.push(...arrnew.map(v => v.stock));
  //             if (arrdel.length)
  //               arrdel.forEach((v) => {
  //                 const i = sitems.findIndex(vx => vx.id == v.stock.id);
  //                 saleStorage.splice(i, 1);
  //               })
  //             this.apiService.updateStockItems(sitems);

  //             saleStorage.sort((a, b) => {
  //               if (b.position < a.position) return -1;
  //             })
  //             console.log(saleStorage);
  //             this.vendingOnSale.push(...saleStorage);
  //             console.log(this.vendingOnSale);
  //             this.saleList.push(...this.vendingOnSale);

  //             this.saleList.sort((a, b) => {
  //               if (a.position < b.position) return -1;
  //             })
  //             console.log(this.saleList);
  //           }
  //           if (this.saleList[0].position == 0) this.compensation = 1;
  //         })
  //       })
  //       // window.location.reload();
  //     } else {
  //       alert(r.message)
  //     }
  //   })
  // }
  endCount() {
    if (this.timeoutHandler) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
    if (this.manageStockCount >= 3) {
      this.manageStock();
    }
    this.manageStockCount = 0;
  }
  holdCount() {
    this.timeoutHandler = setInterval(() => {
      ++this.manageStockCount;
    }, 1000);
  }
  async manageStock() {
    const x = prompt('password');
    console.log(x, this.getPassword());

    if (!this.getPassword().endsWith(x) || x.length < 6) return;
    const m = await this.apiService.showModal(StocksalePage);
    m.onDidDismiss().then(r => {
      r.data;
      console.log('manageStock', r.data);
      // if (r.data) {
      const k = 'refillSaleStock';
      this.storage.get(k + '_', k).then(rx => {
        const b = rx.v as Array<IVendingMachineSale>;
        const s = b ? b : [];
        const u = new Date();
        this.vendingOnSale.forEach(v => v.updatedAt = u);
        s.unshift(...this.vendingOnSale);
        this.storage.set(k + '_', s, k)
      })

      // } else {
      //   console.log('Canceled');

      // }
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
    this.apiService.showLoading();
    if (x.stock.price == 0) {
      this.apiService.getFreeProduct(x.position, x.stock.id).subscribe(r => {
        console.log(r);
        if (r.status) {
          this.apiService.toast.create({ message: r.message, duration: 2000 }).then(r => {
            r.present();
            const y = this.apiService.vendingOnSale.find(v => v.position == x.position);
            y.stock.qtty--;
            console.log('yyyyy', y, x);

            this.storage.set('bill_' + new Date().getTime(), y, 'bills')
            // PLAY SOUNDS
            this.storage.set('saleStock', this.apiService.vendingOnSale, 'stock');
          })
        } else {
          this.apiService.toast.create({ message: r.message, duration: 5000 }).then(r => {
            r.present();
          })
        }
        setTimeout(() => {
          this.audio = new Audio('assets/khopchay.mp3');
          this.audio.play();
          this.apiService.dismissLoading();
        }, 3000);
      });
    } else {
      const amount = x.stock.price * 1;
      this.apiService.buyMMoney([x], amount, this.machineId.machineId).subscribe(r => {
        console.log(r);
        if (r.status) {
          this.bills = r.data as IVendingMachineBill;
          // localStorage.setItem('order', JSON.stringify(this.bills));
          this.storage.set('order_' + new Date().getTime(), this.bills, 'orders')
          new qrlogo({ logo: '../../assets/icon/mmoney.png', content: this.bills.qr }).getCanvas().then(r => {
            this.apiService.modal.create({ component: QrpayPage, componentProps: { encodedData: r.toDataURL(), amount, ref: this.bills.paymentref }, cssClass: 'dialog-fullscreen' },).then(r => {
              r.present();

            });
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
        setTimeout(() => {
          this.apiService.dismissLoading();
        }, 1000);
      })
    }
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
          this.apiService.modal.create({ component: QrpayPage, componentProps: { encodedData: r.toDataURL(), amount, ref: this.bills.paymentref }, cssClass: 'dialog-fullscreen' }).then(r => {
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
      this.getTotalSale.q = 0;
      this.getTotalSale.t = 0;
      // this.orders = [];
      this.summarizeOrder = [];
    });

  }

  addOrder(x: IVendingMachineSale) {
    // this.zone.runOutsideAngular(() => {
    // const ord = this.orders.find(v=>v.stock.id==x.stock.id);
    if (x.stock.qtty < 1) return alert('Out of Stock');
    console.log('ID', x);
    if (!x) return alert('not found');

    this.apiService.showLoading();

    if (this.orders.find(v => v.position == x.position)) {
      const mx = x.max;
      const summ = this.getSummarizeOrder();
      const re = summ.find(v => (v.stock.qtty + 1) > mx && v.position == x.position);
      console.log(summ, mx, re);
      if (re)
        return alert('Out of Stock');
    }
   
    // if (x.stock.qtty <= 0) alert('Out Of order');
   
    const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
    y.stock.qtty = 1;
    console.log('y', y);
    this.orders.push(y);
    
    setTimeout(() => {
      this.apiService.dismissLoading();
    }, 1000);
    console.log('sum',this.getSummarizeOrder());
    

    // });
  }
  checkCartCount(position: number) {
    return this.orders.find(v => v.position == position)?.stock?.qtty || 0;
  }
  getSummarizeOrder() {
    this.summarizeOrder=new Array<IVendingMachineSale>();
    const o = new Array<IVendingMachineSale>();
    const ord = JSON.parse(JSON.stringify( this.orders)) as Array<IVendingMachineSale>;
    ord.forEach(v => {
      const x = o.find(x => x.stock.id == v.stock.id);
      if (!x) o.push(v);
      else x.stock.qtty += 1
    });
    console.log('OOOO',o);
    
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
  // showCart() {
  //   this.apiService.showModal(ShowcartPage, { orders: this.orders, compensation: this.compensation }).then(r => {
  //     r.present();
  //   })
  // }
  getPassword() {
    let x = '';
    this.apiService.machineuuid.split('').forEach(v => {
      !Number.isNaN(Number.parseInt(v)) ? x += v : '';
    })
    return x;
  }

  removeCart(i: number) {
    const x = this.summarizeOrder.splice(i, 1);
    const y = this.orders.findIndex(v => x[0]?.position == v.position);
    if (y != -1) {
      this.orders.splice(y, 1);
      this.getSummarizeOrder();
    }
  }
}
