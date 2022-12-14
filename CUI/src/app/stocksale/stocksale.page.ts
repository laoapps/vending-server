import { Component, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IonicStorageService } from '../ionic-storage.service';
import { ApiService } from '../services/api.service';
import { IStock, IVendingMachineSale } from '../services/syste.model';
import { StockPage } from '../stock/stock.page';
@Component({
  selector: 'app-stocksale',
  templateUrl: './stocksale.page.html',
  styleUrls: ['./stocksale.page.scss'],
})
export class StocksalePage implements OnInit {

  saleStock: IVendingMachineSale[];
  stock = new Array<IStock>();
  compensation=0;
  url = this.apiService.url
  constructor(public apiService: ApiService,
    public storage: IonicStorageService) {
    this.saleStock = apiService.vendingOnSale;
  
  }
  async changeStock(position: number) {
    console.log('stock ', this.stock);
    
    if (!this.stock.length) return alert('no stock')
    const s = await this.apiService.showModal(StockPage, {stock:this.stock,selectedItem:this.saleStock.find(v=>position==position)?.stock});
    s.onDidDismiss().then(r => {
      if (r.data) {
        console.log('r.data',r.data);
        
        const x = this.saleStock.find(v => v.position == position);
        const qtt = x.stock.qtty;
         if (x) Object.keys(x.stock).forEach(k=>x.stock[k]=r.data.data[k]);
        x.stock.qtty=qtt;
        if(this.saleStock[0].position==0)this.compensation=1;
      }
    })
    s.present();
  }


  ngOnInit() {
    this.stock=[];
    this.saleStock.map(vs => vs.stock).forEach(v => {
      // console.log('stock',v);
      
      if (! this.stock.find(y => y.id == v.id))
        this.stock.push(v);
    });
    
    if(this.saleStock[0].position==0)this.compensation=1;
  }
  close() {
    console.log('CLOSE');

    this.apiService.closeModal(true);
  }

  cancel() {
    console.log('CLOSE');

    this.apiService.closeModal(false);
  }
}
