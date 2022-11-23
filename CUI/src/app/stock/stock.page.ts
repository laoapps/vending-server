import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IStock, IVendingMachineSale } from '../services/syste.model';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
})
export class StockPage implements OnInit {
 
  @Input()stock: Array<IStock>=[];
  selectedItem:IStock;
  constructor(public apiService:ApiService) {
   }

   select(id:number){
    this.selectedItem = this.stock.find(v=>v.id==id);
   }
   close(){
    if(!this.selectedItem) alert('Selecte on item please!');
   this.apiService.dismissModal(this.selectedItem)
   }
  ngOnInit() {
  }

}
