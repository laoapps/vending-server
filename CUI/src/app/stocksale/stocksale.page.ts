import { Component, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IonicStorageService } from '../ionic-storage.service';
import { ApiService } from '../services/api.service';
import { IStock, IVendingMachineSale } from '../services/syste.model';
import { StockPage } from '../stock/stock.page';
import { ReportbillsPage } from '../reportbills/reportbills.page';
import { ReportrefillsalePage } from '../reportrefillsale/reportrefillsale.page';
@Component({
  selector: 'app-stocksale',
  templateUrl: './stocksale.page.html',
  styleUrls: ['./stocksale.page.scss'],
})
export class StocksalePage implements OnInit {

  saleStock: IVendingMachineSale[];
  stock = new Array<IStock>();
  compensation=0;
  url = this.apiService.url;
  isDisabled='';
  search='';
  constructor(public apiService: ApiService,
    public storage: IonicStorageService) {
    this.saleStock = apiService.vendingOnSale;
    this.saleStock.sort((a,b)=>a.position>b.position?1:-1);
  }
  refillAll(){
    const conf =confirm('Are you sure ?');
    if(!conf) return;
    const p =prompt('please type 123456');
    if(p!=='123456') return;
    this.saleStock.forEach(v=>{
      v.stock.qtty=v.max;
    })
    alert('Done');
  }
  async reportSale(){
    const s = await this.apiService.showModal(ReportrefillsalePage);
    s.onDidDismiss().then(r => {
      if (r.data) {
     
      }
    })
    s.present();
  }
  async reportBills(){
   


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
      if (r.data) {
        const s = JSON.parse(JSON.stringify(r.data.data)) as IStock;
        // console.log('r.data',r.data);
        // console.log('s',s);
        
        const x = this.saleStock.find(v => v.position == position);
        const qtt = x.stock.qtty;
         if (x) Object.keys(x.stock).forEach(k=>x.stock[k]=s[k]);
        x.stock.qtty=qtt;
        if(this.saleStock[0].position==0)this.compensation=1;
        this.save();
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
  reset(){
   const c =  confirm('Clear all data');
   if(c){
    // this.storage.clear();
    this.storage.set('saleStock',[], 'stock').then(r=>{
      console.log('reset',r);
      window.location.reload();
    }).catch(e=>{
      console.log('reset error',e);
      
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

  save(){
    this.storage.set('saleStock', this.saleStock, 'stock').then(r => {
      // console.log('SAVE saleStock', r);
    }).catch(e => {
      console.log('Error', e);
    })
  }
  selectItem(pos=''){
    setTimeout(() => {
      this.isDisabled =pos;
    }, 500);
   
  }

  doFilter(){
    if(this.search)
    {
      this.saleStock = this.apiService.vendingOnSale.filter(v=>(v.position+'').includes(this.search.toLowerCase())||(v.stock.name.toLowerCase()).includes(this.search.toLowerCase()));
      this.saleStock.sort((a,b)=>a.position>b.position?1:-1);
    }
    else {
      this.saleStock = this.apiService.vendingOnSale;
      this.saleStock.sort((a,b)=>a.position>b.position?1:-1);
    }
  }
}
