import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { MyaccountPage } from '../myaccount/myaccount.page';
import { MachinePage } from '../machine/machine.page';
import { ProductsPage } from '../products/products.page';
import { SalePage } from '../sale/sale.page';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(public apiService:ApiService) {}
  show(i:number){
    switch (i) {
      case 1:
          this.apiService.showModal(MyaccountPage,{}).then(r=>{r?.present()});
        break;
        case 2:
          this.apiService.showModal(MachinePage,{}).then(r=>{r?.present()});
        break;
        case 3:
          this.apiService.showModal(ProductsPage,{}).then(r=>{r?.present()});
        break;
        case 4:
          this.apiService.showModal(SalePage,{}).then(r=>{r?.present()});
        break;

    
      default:
        break;
    }
  }
}
