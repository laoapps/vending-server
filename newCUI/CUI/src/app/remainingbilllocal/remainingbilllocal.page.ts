import { Component, Input, OnInit } from '@angular/core';
import { IBillProcess } from '../services/syste.model';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-remainingbilllocal',
  templateUrl: './remainingbilllocal.page.html',
  styleUrls: ['./remainingbilllocal.page.scss'],
})
export class RemainingbilllocalPage implements OnInit {


  canclick: boolean = false;
  errorClick: number = 0;

  timer: any = {} as any;
  counter: number = localStorage.getItem('product_fall') ? Number(localStorage.getItem('product_fall')) : 0;
  counterLimit: number = localStorage.getItem('product_fall_limit') ? Number(localStorage.getItem('product_fall_limit')) : 10;

  @Input() r = new Array<IBillProcess>();
  url = this.apiService.url;
  lists: Array<any> = [];


  constructor(public apiService: ApiService) {

  }

  ngOnInit() {
    console.log('R', this.r);

  }

  closeToolTip() {
    (document.querySelector('.tooltip-background') as HTMLDivElement).classList.remove('active');
    (document.querySelector('.hand-click') as HTMLDivElement).classList.remove('active');

    if (this.counter > 3 && this.counter < this.counterLimit) {
      this.canclick = true;
    }
  }

  reload() {
    window.location.reload();
  }

  findImage(id: number) {
    return ApiService.vendingOnSale.find(vy => vy.stock.id == id)?.stock?.image;
  }

  findPrice(id: number) {
    return ApiService.vendingOnSale.find(vy => vy.stock.id == id)?.stock?.price;
  }
  retryProcessBill(transactionID: string, position: number) {
    this.apiService.IndexedDB.deleteBillProcess(Number(transactionID));

    // this.apiService.retryProcessBillLocal(transactionID, position).subscribe(r => {
    //   console.log('retryProcessBill', r);
    //   if (r.status) {
    //     console.log('retry ok', r.data);

    //   }
    //   this.apiService.toast.create({ message: r.message, duration: 3000 }).then(r => {
    //     r.present();
    //   })
    // })
  }
  getStock(position: number) {
    return this.r.map(v => v.bill.vendingsales)[0].find(v => v.position == position)?.stock;
  }
}
