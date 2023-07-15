import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { MyaccountPage } from '../myaccount/myaccount.page';
import { MachinePage } from '../machine/machine.page';
import { ProductsPage } from '../products/products.page';
import { SalePage } from '../sale/sale.page';
import { EpinAdminPage } from '../epin-admin/epin-admin.page';
import { EpinSubadminPage } from '../epin-subadmin/epin-subadmin.page';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit {
  // defendClick: boolean = true;

  constructor(public apiService:ApiService) {
    this.apiService.ownerUuid = localStorage.getItem('lva_ownerUuid');
    this.apiService.passkeys = localStorage.getItem('lva_passkeys');
    this.apiService.name = localStorage.getItem('lva_name');
  }

  async ngOnInit() {
      // let loading = await this.apiService.load.create({ message: 'initialize system' });
      // loading.present();
      // setTimeout(async () => {
      //   await loading.dismiss();
      //   this.defendClick = false;
      // }, 100);
  }

  show(i:number){
    // if (this.defendClick == true) return;
    // if (this.defendClick == false) {
    //   this.defendClick = true;
      
    // }
    switch (i) {
      case 1:
        this.apiService.showModal(MyaccountPage,{}).then(r=>{
          r?.present();
          r.onDidDismiss().then(() => {});
        });
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
      case 5:
        this.apiService.showModal(EpinAdminPage,{}).then(r=>{r?.present()});
        break;
      case 6:
        this.apiService.showModal(EpinSubadminPage,{}).then(r=>{r?.present()});
        break;
    
      default:
        break;
    }
  }
}
