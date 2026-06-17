import { Component, Input, OnDestroy, OnInit, Output, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IonicStorageService } from '../ionic-storage.service';
import { ApiService } from '../services/api.service';
import { IStock, IVendingMachineSale } from '../services/syste.model';
import { StockPage } from '../stock/stock.page';
import { ReportbillsPage } from '../reportbills/reportbills.page';
import { ReportrefillsalePage } from '../reportrefillsale/reportrefillsale.page';
import { AlertController, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-stocksale',
  templateUrl: './stocksale.page.html',
  styleUrls: ['./stocksale.page.scss'],
})
export class StocksalePage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;

  prod = environment.production
  saleStock = new Array<IVendingMachineSale>();
  stock = new Array<IStock>();
  compensation = 0;
  url = this.apiService.url;
  isDisabled = '';
  search = '';
  jsonText = ';'
  isResetCash = false;

  // Scrollbar properties
  scrollTop = 0;
  contentHeight = 0;
  viewHeight = 0;
  thumbHeight = 0;
  thumbTop = 0;
  isDragging = false;
  startY = 0;
  startThumbTop = 0;
  scrollInterval: any;

  constructor(public apiService: ApiService,
    public alertController: AlertController,
    public storage: IonicStorageService) {
    this.saleStock = ApiService.vendingOnSale;
    this.saleStock.sort((a, b) => a.position > b.position ? 1 : -1);
    console.log(`TEST SALE STOCK`, this.saleStock);
    // this.stock=apiService.stock;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateScrollbar();
    }, 1000);
  }

  async onScroll(event: any) {
    this.scrollTop = event.detail.scrollTop;
    await this.updateScrollbar();
  }

  async updateScrollbar() {
    if (!this.content) return;
    const scrollElement = await this.content.getScrollElement();
    if (!scrollElement) return;

    this.contentHeight = scrollElement.scrollHeight;
    this.viewHeight = scrollElement.clientHeight;

    if (this.contentHeight > this.viewHeight) {
      this.thumbHeight = Math.max((this.viewHeight / this.contentHeight) * (this.viewHeight - 120), 40);
      const scrollableHeight = this.contentHeight - this.viewHeight;
      const trackHeight = (this.viewHeight - 120) - this.thumbHeight;
      this.thumbTop = (this.scrollTop / scrollableHeight) * trackHeight;
    } else {
      this.thumbHeight = 0;
    }
  }

  startScrollUp() {
    this.stopScroll();
    this.scrollInterval = setInterval(async () => {
      const newScrollTop = Math.max(0, this.scrollTop - 50);
      this.content.scrollToPoint(0, newScrollTop, 100);
      if (newScrollTop === 0) this.stopScroll();
    }, 100);
  }

  startScrollDown() {
    this.stopScroll();
    this.scrollInterval = setInterval(async () => {
      const scrollElement = await this.content.getScrollElement();
      const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
      const newScrollTop = Math.min(maxScroll, this.scrollTop + 50);
      this.content.scrollToPoint(0, newScrollTop, 100);
      if (newScrollTop === maxScroll) this.stopScroll();
    }, 100);
  }

  stopScroll() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  startDragging(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startY = (event instanceof MouseEvent) ? event.pageY : event.touches[0].pageY;
    this.startThumbTop = this.thumbTop;
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDragging(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const currentY = (event instanceof MouseEvent) ? event.pageY : event.touches[0].pageY;
    const deltaY = currentY - this.startY;
    const trackHeight = (this.viewHeight - 120) - this.thumbHeight;
    let newThumbTop = this.startThumbTop + deltaY;

    newThumbTop = Math.max(0, Math.min(newThumbTop, trackHeight));
    this.thumbTop = newThumbTop;

    const scrollableHeight = this.contentHeight - this.viewHeight;
    const targetScrollTop = (this.thumbTop / trackHeight) * scrollableHeight;
    this.content.scrollToPoint(0, targetScrollTop, 0);
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  stopDragging() {
    this.isDragging = false;
  }

  ngOnDestroy(): void {
    this.stopScroll();
  }

  saveSaveStock() {
    try {
      this.apiService.saveSale(ApiService.vendingOnSale).then(rx => {
        const r = rx.data;
        // console.log('-----> saveSaveStock :', JSON.stringify(r));
        // if (r.status) {

        // }
        if (r.status === 1) {
          this.apiService.closeModal({ resetCashCount: this.isResetCash });
          this.apiService.toast.create({ message: 'ສຳເຫຼັດແລ້ວ', duration: 2000 }).then(r => {
            r.present();
          })
        } else {
          this.apiService.closeModal({ resetCashCount: this.isResetCash });
          this.apiService.toast.create({ message: 'ອິນເຕີເນັດຊ້າ ກະລຸນາລໍຖ້າແລ້ວລອງໃໝ່ອີກຄັ້ງ', duration: 2000 }).then(r => {
            r.present();
          })
        }

      })
    } catch (error) {
      this.apiService.toast.create({ message: `ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ`, duration: 2000 }).then(r => {
        r.present();
      })
    }
  }

  closePage() {
    try {
      this.apiService.closeModal({ resetCashCount: this.isResetCash });
    } catch (error) {

    }
  }
  refillAll() {
    const conf = confirm('Are you sure ?');
    if (!conf) return;
    const p = prompt('please type 123456');
    if (p !== '123456') return;
    this.saleStock.forEach(v => {
      v.stock.qtty = v.max;
    })
    alert('Done');
  }
  async reportSale() {
    const s = await this.apiService.showModal(ReportrefillsalePage);
    s.onDidDismiss().then(r => {
      if (r.data) {

      }
    })
    s.present();
  }

  async saveSale() {
    alert('Are you going to save sale to online');
    const p = prompt('please type 12345678');
    if (p == '12345678') {
      // await this.apiService.showLoading(null, 3000);
      const x = [];
      ApiService.vendingOnSale.forEach(v => {
        const e = JSON.parse(JSON.stringify(v));

        x.push(e);
      })
      this.apiService.saveSale(ApiService.vendingOnSale).then(rx => {
        const r = rx.data;
        console.log(r);

        if (r.status) {

        }
        // this.apiService.dismissLoading();
        this.apiService.toast.create({ message: r.message, duration: 2000 }).then(r => {
          r.present();
        })
      })
    }
  }
  async recoverSale() {
    alert('Are you going to recover sale from online');
    const p = prompt('please type 12345678');
    if (p == '12345678') {
      // await this.apiService.showLoading(null, 3000);
      this.apiService.recoverSale().then(rx => {
        const r = rx.data;
        console.log(r);
        if (r.status) {
          ApiService.vendingOnSale.length = 0;
          // r.data.forEach(v=>{
          //   this.apiService.vendingOnSale.push(v);
          // })
          console.log('recover', r.data);

          ApiService.vendingOnSale.push(...r.data)
        }
        // this.apiService.dismissLoading();
        this.apiService.toast.create({ message: r.message, duration: 200 }).then(r => {
          r.present();
        })
      })
    }
  }
  async reportBills() {



    const s = await this.apiService.showModal(ReportbillsPage);
    s.onDidDismiss().then(r => {
      if (r.data) {

      }
    })
    s.present();
  }
  async changeStock(position: number) {
    console.log('stock ', this.stock);

    if (!this.stock.length) return alert('no stock')
    const s = await this.apiService.showModal(StockPage);
    s.onDidDismiss().then(r => {
      try {
        if (r.data) {
          const s = JSON.parse(JSON.stringify(r.data.data)) as IStock;
          // console.log('r.data',r.data);
          console.log('s', s);
          console.log(`sale stock`, this.saleStock);
          const x = this.saleStock.find(v => v.position == position);
          const qtt = x.stock.qtty;
          if (x) Object.keys(x.stock).forEach(k => x.stock[k] = s[k]);
          x.stock.qtty = qtt;

          console.log('x', x);

          if (this.saleStock[0].position == 0) this.compensation = 1;
          this.save();
        }
      } catch (error) {
        console.log(error);

      }

    })
    s.present();
  }
  setMax(position: number) {

    const x = this.saleStock.find(v => v.position == position);
    this.alertController.create({
      cssClass: '',
      header: 'Set Max!',
      inputs: [
        {
          name: 'maxqtty',
          type: 'number',
          value: 5,
          min: 3,
          max: 20,
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {

          },
        },
        {
          text: 'Ok',
          handler: (v) => {
            try {
              console.log('CONFRIM', v);
              const x = this.saleStock.find(v => v.position == position);
              x.max = Number(v.maxqtty);
              if (this.saleStock[0].position == 0) this.compensation = 1;
              this.save();
            } catch (error) {
              console.log(error);
            }
          },
        },
      ],
    }).then(r => {
      r.present();
    });




  }


  ngOnInit() {
    this.stock = [];
    const maxPosition = Number(localStorage.getItem('maxPosition')) || 60;
    console.log('saleStock', this.saleStock.length);
    if (this.saleStock.length < maxPosition) {
      Array.from(Array(maxPosition), (_, i) => i + 1).forEach(v => this.saleStock.find(vx => vx.position == v) ||
        this.saleStock.push({
          machineId: this.apiService.machineId.machineId,
          position: v,
          isActive: true,
          id: -1,
          max: 5,
          // stock:{imgUrl: '', image:'',name:'',price:-1,qtty:0,id:-1} as IStock
          stock: { image: '', name: '', price: -1, qtty: 0, id: -1 } as IStock
        } as IVendingMachineSale));

    }


    console.log('saleStock', this.saleStock.length);

    this.saleStock.map(vs => vs.stock).forEach(v => {
      // console.log('stock',v);

      if (!this.stock.find(y => y.id == v.id))
        this.stock.push(v);
    });

    if (this.saleStock[0].position == 0) this.compensation = 1;
  }
  reset() {
    const c = confirm('Clear all data');
    if (c) {
      // this.storage.clear();
      this.storage.set('saleStock', [], 'stock').then(r => {
        console.log('reset', r);
        // window.location.reload();
        this.apiService.reloadPage();
      }).catch(e => {
        console.log('reset error', e);

      });

    }
  }
  close() {
    console.log('CLOSE');

    this.apiService.closeModal(true);
  }

  cancel() {
    console.log('CLOSE');

    this.apiService.closeModal(false);
  }

  save() {
    // TODO:
    // remove all  base64images , using image from server 
    // this.saleStock.forEach(v=>v.stock.image='');
    this.storage.set('saleStock', this.saleStock, 'stock').then(r => {
      // console.log('SAVE saleStock', r);
    }).catch(e => {
      console.log('Error', e);
    })
  }
  selectItem(pos = '') {
    setTimeout(() => {
      this.isDisabled = pos;
    }, 200);

  }

  doFilter() {
    if (this.search) {
      this.saleStock = ApiService.vendingOnSale.filter(v => (v.position + '').includes(this.search.toLowerCase()) || (v.stock.name.toLowerCase()).includes(this.search.toLowerCase()));
      this.saleStock.sort((a, b) => a.position > b.position ? 1 : -1);
    }
    else {
      this.saleStock = ApiService.vendingOnSale;
      this.saleStock.sort((a, b) => a.position > b.position ? 1 : -1);
    }
    setTimeout(() => this.updateScrollbar(), 300);
  }
  saveJsonText() {
    try {
      alert('ARE YOU SURE?')
      console.log('jsonText', JSON.parse(this.jsonText));

      this.apiService.saveSale(JSON.parse(this.jsonText)).then(rx => {
        const r = rx.data;
        console.log('R', r);

      });
    } catch (error) {
      console.log(error);

    }

  }
}
