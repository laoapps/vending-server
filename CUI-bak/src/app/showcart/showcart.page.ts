import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IVendingMachineSale } from '../services/syste.model';

@Component({
  selector: 'app-showcart',
  templateUrl: './showcart.page.html',
  styleUrls: ['./showcart.page.scss'],
})
export class ShowcartPage implements OnInit {
  @Input() orders = new Array<IVendingMachineSale>();
  @Input() compensation =0;

  
  swidth = 0;
  sheight = 0;
  smode = 2;
  url='';
  summarizeOrder = new Array<IVendingMachineSale>();
  getTotalSale = { q: 0, t: 0 };
  saleList = new Array<Array<IVendingMachineSale>>();
  constructor(public apiService:ApiService ) { 
    this.url = this.apiService.url;
  }

  ngOnInit() {
    
  }
  getSaleList() {
    const x = new Array<Array<IVendingMachineSale>>();

    this.orders.forEach((v, i) => {
      if (i == this.smode) {
        x.push(this.orders.slice(0, i));
      } else if (!(i % this.smode)){ x.push(this.orders.slice(i - this.smode, i))
      }else if(i==this.orders.length-1){
        x.push(this.orders.slice(this.orders.length- this.smode))
      }

    })
    // console.log('x',x);

    return x;
  }
  close() {
    this.apiService.dismissModal();
  }
}
