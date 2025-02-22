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
  search='';
  constructor(public apiService: ApiService) {
    this.stock=apiService.stock;
  }

  select(id: number) {
    this.selectedItem = this.stock.find(v => v.id == id);
    console.log('select',this.selectedItem);
    this.apiService.dismissModal(this.selectedItem);
  }
  close() {
    if (!this.selectedItem) {return alert('Selecte on item please!');}
    console.log(this.selectedItem);
    this.apiService.dismissModal(this.selectedItem);
  }
  removeStock(id: number){
    const conf = confirm('Are you sure');
    if(!conf) {return;}
    const p = prompt('Type 123456');
    if(p!=='123456') {return;}
    const idx =this.apiService.stock.findIndex(v=>v.id==id);
    if(idx!=-1){
      this.apiService.stock.splice(idx,1);
      this.apiService.updateStockItems(this.apiService.stock);
    }
  }
  doFilter(){
    if(this.search)
    {this.stock=this.apiService.stock.filter(v=>v.name.toLowerCase().includes(this.search.toLowerCase()));}
    else {this.stock=this.apiService.stock;}
  }
  ngOnInit() {
  }

}
