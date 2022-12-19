import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiService } from '../services/api.service';
import { IStock, IVendingMachineSale } from '../services/syste.model';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
})
export class StockPage implements OnInit {

  stock: Array<IStock> = [];
  selectedItem: IStock;
  url =this.apiService.url;
  constructor(public apiService: ApiService) {
    this.stock=apiService.stock;
  }

  select(id: number) {
    this.selectedItem = this.stock.find(v => v.id == id);
    console.log(this.selectedItem);
    this.apiService.dismissModal(this.selectedItem)
  }
  close() {
    if (!this.selectedItem) return alert('Selecte on item please!');
    console.log(this.selectedItem);
    this.apiService.dismissModal(this.selectedItem)
  }
  ngOnInit() {
  }

}
