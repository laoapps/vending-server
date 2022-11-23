import { Component, Input, OnInit, Output } from '@angular/core';
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
  stock=new Array<IStock>();
  constructor(public apiService:ApiService,
   public storage: IonicStorageService) {
    this.saleStock= apiService.vendingOnSale;
    this.saleStock.map(v=>this.stock).forEach(v=>{
      if(!v.find(x=>this.stock.find(y=>y.id==x.id)))
        this.stock.push(...v);
    });
    
   }
   async changeStock(position:number){
    if(!this.stock.length)return alert('no stock')
    const s = await this.apiService.showModal(StockPage,this.stock);
    s.onDidDismiss().then(r=>{
      if(r.data){
        const x = this.saleStock.find(v=>v.position==position);
        if(x)x.stock=r.data;
       
      }
    })
    s.present();
   }


  ngOnInit() {
  }

}
