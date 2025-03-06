import { Component, Input, OnInit } from '@angular/core';
import { IBillProcess } from '../services/syste.model';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-remainingbilllocal',
  templateUrl: './remainingbilllocal.page.html',
  styleUrls: ['./remainingbilllocal.page.scss'],
})
export class RemainingbilllocalPage implements OnInit {
  @Input() r = new Array<IBillProcess>();
  url = this.apiService.url;
  constructor(public apiService: ApiService) {

  }

  ngOnInit() {
    console.log('R', this.r);

  }
  findImage(id: number) {
    return ApiService.vendingOnSale.find(vy => vy.stock.id == id)?.stock?.image;
  }
  retryProcessBill(transactionID: string, position: number) {
    this.apiService.retryProcessBillLocal(transactionID, position).subscribe(r => {
      console.log('retryProcessBill', r);
      if (r.status) {
        console.log('retry ok', r.data);

      }
      this.apiService.toast.create({ message: r.message, duration: 3000 }).then(r => {
        r.present();
      })
    })
  }
  getStock(position: number) {
    return this.r.map(v => v.bill.vendingsales)[0].find(v => v.position == position)?.stock;
  }
}
