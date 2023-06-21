import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { EClientCommand, IBillProcess, IMachineClientID, IMachineId, IMMoneyQRRes, IStock, IVendingMachineBill, IVendingMachineSale } from '../services/syste.model';
import { ModalController, Platform } from '@ionic/angular';
// import { BarcodeScanner, BarcodeScannerOptions } from "@ionic-native/barcode-scanner/ngx";
import { QrpayPage } from '../qrpay/qrpay.page';
import qrlogo from 'qrcode-with-logos';
import { StocksalePage } from '../stocksale/stocksale.page';
import { IonicStorageService } from '../ionic-storage.service';
import { CachingService } from '../services/caching.service';
import { environment } from 'src/environments/environment';
import { ShowcartPage } from '../showcart/showcart.page';

import { VendingAPIService } from '../services/vending-api.service';
import { LoadVendingWalletCoinBalanceProcess } from './processes/loadVendingWalletCoinBalance.process';
import { IENMessage } from '../models/base.model';
import { CashValidationProcess } from './processes/cashValidation.process';
import { CashinValidationProcess } from './processes/cashinValidation.process';
import { LaabGoPage } from './LAAB/laab-go/laab-go.page';
import { EpinCashOutPage } from './LAAB/epin-cash-out/epin-cash-out.page';
import * as cryptojs from 'crypto-js';

import { RemainingbillsPage } from '../remainingbills/remainingbills.page';
import * as QRCode from 'qrcode';
import { LaabCashinShowCodePage } from './LAAB/laab-cashin-show-code/laab-cashin-show-code.page';
import { LaabCashoutPage } from './LAAB/laab-cashout/laab-cashout.page';


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
  audio = new Audio('assets/mixkit-female-says-thank-you-380.wav');

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

      // alert('V1_'+this.mmLogo);      

      // ref.detach();
      // this.zone.runOutsideAngular(()=>{
      this.machineId = this.apiService.machineId;
      this.url = this.apiService.url;
      // this.initVendingSale();


      platform.ready().then(() => {
          this.apiService.audioElement = document.createElement('audio');
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
            this.apiService.myTab1 = this;
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
      console.log(`load vending sale`, r.data);
      if (r.status) {
        const saleServer = r.data as Array<IVendingMachineSale>;
        console.log('saleServer', saleServer);

        this.apiService.newStockItems(saleServer);
        
        // window.location.reload();
        this.storage.get('saleStock', 'stock').then(s => {
          console.log(`storage get`, s);
          const saleitems = JSON.parse(JSON.stringify(s?.v ? s.v : [])) as Array<IVendingMachineSale>;
          console.log(`saleitems`, saleitems);
          this.saleList.sort((a, b) => {
            if (a.position < b.position) return -1;
          });
          this.vendingOnSale.push(...saleitems);
          this.saleList.push(...this.vendingOnSale);
          if (this.saleList[0]?.position == 0) this.compensation = 1;
         
          setTimeout(() => {
            this.showBills();
          }, 1000);

          this.initVendingWalletCoinBalance().then(() => {});

          console.log(`sale list der`, this.saleList);
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

  //               this.saleList.sort((a, b) => {
  //                 if (a.position < b.position) return -1;
  //               })
  //               console.log(this.saleList);
  //             }
  //             if (this.saleList[0].position == 0) this.compensation = 1;
  //           })
  //         })
  //         // window.location.reload();
  //       } else {
  //         alert(r.message)
  //       }
  //     })
  // }
  // initVendingSale() {

  //   /// NOT IMPLEMENT YET
  //   this.apiService.loadVendingSale().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.storage.get('stockitems_', 'item').then(rx => {
  //         const items = JSON.parse(JSON.stringify(rx?.v ? rx?.v : [])) as Array<IStock>;
  //         const sitems = items ? items : [];
  //       })
  //       // window.location.reload();
  //     } else {
  //       alert(r.message)
  //     }
  //   })
  // }
  // initDemo() {
  //   this.apiService.initDemo().subscribe(r => {
  //     console.log(r);
  //     if (r.status) {
  //       this.storage.get('stockitems_', 'item').then(rx => {
  //         const items = JSON.parse(JSON.stringify(rx?.v ? rx?.v : [])) as Array<IStock>;
  //         const sitems = items ? items : [];
  //         this.storage.get('saleStock', 'stock').then(s => {
  //           console.log('stock', s);

  //           const saleitems = JSON.parse(JSON.stringify(s?.v ? s.v : [])) as Array<IVendingMachineSale>;
  //           const saleStorage = saleitems ? saleitems : [] as Array<IVendingMachineSale>;
  //           const saleServer = r.data as Array<IVendingMachineSale>;

  //           const arrdel = [] as Array<IVendingMachineSale>;;
  //           const arrnew = [] as Array<IVendingMachineSale>;;
  //           if (!saleStorage.length) {
  //             saleServer.forEach(v => !saleStorage.find(vs => vs.stock.id == v.stock.id) ? arrnew.push(v) : '');
  //             saleStorage.forEach(v => !saleServer.find(vs => vs.stock.id == v.stock.id) ? arrdel.push(v) : '');

  //             if (arrnew.length)
  //               saleStorage.push(...arrnew);
  //             if (arrdel.length)
  //               arrdel.forEach((v) => {
  //                 const i = saleStorage.findIndex(vx => vx.stock.id == v.stock.id);
  //                 saleStorage.splice(i, 1);
  //               })

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

    if(environment.production)
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
          this.audio = new Audio('assets/mixkit-female-says-thank-you-380.wav');
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
    console.log(`getTotalSale`, this.getTotalSale.q, this.getTotalSale.t);
    if (!x) return alert('not found');

    this.apiService.showLoading();

    if (this.orders.find(v => v.position == x.position)) {
      const mx = x.max;
      // const summ = this.getSummarizeOrder();
      // const summ  = this.summarizeOrder;
      const re = this.orders.find(v => {
        const o = this.orders.filter(vx=>vx.stock.id==v.stock.id);
        console.log('o',o,'reduce',o.reduce((a,b)=>a+b.stock.qtty,0),'mx',mx,'pos',x.position,v.position);
        
        return (o.reduce((a,b)=>a+b.stock.qtty,0))+1 > mx && v.position == x.position
      });
       console.log('0x0r',this.orders, mx, re);
      if (re){
         setTimeout(() => {
        this.apiService.dismissLoading();
      }, 1000);
        return alert('Out of Stock');
      }
     
    }
   
    // if (x.stock.qtty <= 0) alert('Out Of order');
   
    const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
    y.stock.qtty = 1;
    console.log('y', y);
    this.orders.push(y);
    //  console.log('sum',this.getSummarizeOrder());
    this.getSummarizeOrder();
    setTimeout(() => {
      this.apiService.dismissLoading();
    }, 1000);
   
    

    // });
  }
  checkCartCount(position: number) {
    return this.orders.find(v => v.position == position)?.stock?.qtty || 0;
  }
  getSummarizeOrder() {
    // this.summarizeOrder=new Array<IVendingMachineSale>();
    const o = new Array<IVendingMachineSale>();
    const ord = JSON.parse(JSON.stringify( this.orders)) as Array<IVendingMachineSale>;
    ord.forEach(v => {
      const x = o.find(x => x.stock.id == v.stock.id);
      if (!x) o.push(v);
      else x.stock.qtty += 1
    });
    console.log('OOOO',o);
    
    // this.summarizeOrder.push(...o);
    const t = this.getTotal();
    Object.keys(this.getTotalSale).forEach(k => {
      this.getTotalSale[k] = t[k];
    })
    // return this.summarizeOrder;
  }
  getTotal() {
    const o = this.orders;
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
    const x = this.orders.splice(i, 1);
    this.getSummarizeOrder();
    // const y = this.orders.findIndex(v => x[0]?.position == v.position);
    // if (y != -1) {
    //   this.orders.splice(y, 1);
    //   this.getSummarizeOrder();
    // }
  }





  
  initVendingWalletCoinBalance(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        // const machineId: string = localStorage.getItem('machineId');
        const params = {
          
        }
        const run = await this.loadVendingWalletCoinBalanceProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.apiService.cash = run.data[0].vendingWalletCoinBalance;
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  cashin(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        // const machineId: string = localStorage.getItem('machineId');
        let params: any = {
          
        }
        let run: any = await this.cashValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.acceptcash = run.data[0].acceptcash;
        const cashList = await this.cashList();

        params = {

          cash: cashList,
          description: 'VENDING CASH IN'
        }
        run = await this.cashinValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.apiService.cash = Number(this.apiService.cash) + Number(cashList);

        resolve(IENMessage.success);

      } catch (error) {
        await this.apiService.openSoundSystemError();
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  cashList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
       
        let message: any = {} as any;
        let inputs: Array<any> = [
          {
            type: 'radio',
            label: '1,000',
            handler: async () => {
              await message.dismiss();
              resolve(1000);
            },
          },
          {
            type: 'radio',
            label: '5,000',
            handler: async () => {
              await message.dismiss();
              resolve(5000);
            },
          },
          {
            type: 'radio',
            label: '10,000',
            handler: async () => {
              await message.dismiss();
              resolve(10000);
              
            },
          },
          {
            type: 'radio',
            label: '20,000',
            handler: async () => {
              await message.dismiss();
              resolve(20000);
                
            },
          },
          {
            type: 'radio',
            label: '50,000',
            handler: async () => {
              await message.dismiss();
              resolve(50000);
                
            },
          },
          {
            type: 'radio',
            label: '100,000',
            handler: async () => {
              await message.dismiss();
              resolve(100000);
                
            },
          },
        ];
        if (this.acceptcash == 100000) {
          inputs.splice(inputs.length - 0, 0);
        } else if (this.acceptcash == 50000) {
          inputs.splice(inputs.length - 1, 1);
        } else if (this.acceptcash == 20000) {
          inputs.splice(inputs.length - 2, 2);
        } else if (this.acceptcash == 10000) {
          inputs.splice(inputs.length - 3, 3);
        } else if (this.acceptcash == 5000) {
          inputs.splice(inputs.length - 4, 4);
        } else {
          inputs = [];
        }

        message = await this.apiService.alert.create({
          header: 'Cash In',
          inputs: inputs
        });
        message.present();

      } catch (error) {
        resolve(error.message);
      }
    });
  }
  laabGo(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.summarizeOrder = JSON.parse(JSON.stringify(this.orders));

        this.summarizeOrder.forEach(item => item.stock.image = '');
        
        console.log(`summarizeOrder`, this.summarizeOrder);
        let sum_quantity: number = 0;
        let sum_total: number = 0;
        for(let i = 0; i < this.summarizeOrder.length; i++) {
          sum_quantity += this.summarizeOrder[i].stock.qtty;
          sum_total += this.summarizeOrder[i].stock.qtty * this.summarizeOrder[i].stock.price;
        }
        console.log(`sum total`, sum_total);
        if (this.apiService.cash < sum_total){
          await this.apiService.openSoundPleaseInsertBanknotes();
          throw new Error(IENMessage.notEnoughtCashBalance);
        }
        const sum_refund = this.apiService.cash - sum_total;

        const paidLAAB = {
          command: EClientCommand.paidLAAB,
          data: {
            ids: this.summarizeOrder,
            value: sum_total,
            clientId: this.apiService.clientId.clientId
          },
          ip: '',
          time: new Date().toString(),
          token:  cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
        }

        const props = {
          machineId: localStorage.getItem('machineId') || '12345678',
          cash: this.apiService.cash,
          quantity: sum_quantity,
          total: sum_total,
          balance: sum_refund,
          paidLAAB: paidLAAB,
        }
        console.log(`props`, props);

        this.apiService.modal.create({ component: LaabGoPage, componentProps: props }).then(r => {
          r.present();
        });
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  clearStockAfterLAABGo() {
    this.orders = [];
    this.getTotalSale.q = 0;
    this.getTotalSale.t = 0;
  }
  epinCashOut(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.apiService.modal.create({ component: EpinCashOutPage, componentProps: {} }).then(r => {
          r.present();
        });

      } catch (error) {
        resolve(error.message);
      }
    });
  }
  laabCashin(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        // const machineId: string = localStorage.getItem('machineId');
        let params: any = {
        }
        let run: any = await this.cashValidationProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        this.acceptcash = run.data[0].acceptcash;
        const cashList = await this.cashList();

        params = {
          cash: cashList,
          description: 'VENDING CASH IN'
        }
        console.log(`params`, params);

        let qrModel = {
          type: 'CQR',
          mode: 'COIN',
          destination: this.apiService.laabuuid,
          amount: cashList,
          expire: '',
          options: {
            coinname: this.apiService.coinName,
            name: this.apiService.name,
          }
        }

        QRCode.toDataURL(JSON.stringify(qrModel)).then(async r => {
          const props = {
            qrImage: r
          }
          this.apiService.modal.create({ component: LaabCashinShowCodePage, componentProps: props }).then(r => {
            r.present();
            resolve(IENMessage.success);
          });
        });

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  laabCashout(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (this.apiService.cash == 0) throw new Error(IENMessage.thereIsNotBalance);

        const props = {
        }
        this.apiService.modal.create({ component: LaabCashoutPage, componentProps: props }).then(r => {
          r.present();
          resolve(IENMessage.success);
        });

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    })
  }
  showBills(){
    console.log(`here`);
    this.apiService.loadDeliveryingBills().subscribe(r => {
      console.log(`response`, r);
      if (r.status) {
        this.apiService.dismissModal();
        this.apiService. pb = r.data as Array<IBillProcess>;
        if( this.apiService. pb.length)
        this.apiService.showModal(RemainingbillsPage, { r: this.apiService. pb}).then(r=>{
          r.present();
        });
      }
      else {
        this.apiService.toast.create({ message: r.message, duration: 5000 }).then(r => {
          r.present();
        })
      }
    });
  }
  public reshowBills(count: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let loading = this.apiService.load.create({ message: 'Please wait...' });

        if (count > 0) {
          (await loading).present();
          let i = setTimeout(async () => {
            (await loading).dismiss();
            this.showBills();
          }, 1000);
  
        }


        resolve(IENMessage.success);
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    })
    
  }
}
