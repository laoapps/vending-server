import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IMachineClientID, IMachineId, IMMoneyQRRes, IVendingMachineBill, IVendingMachineSale } from '../services/syste.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();

  mMoneyRes = {} as IMMoneyQRRes;

  machineId={} as IMachineId;

  url = 'http://localhost:9009'
  orders =  new Array<IVendingMachineSale>();
  constructor(public apiService:ApiService) {
    this.machineId = this.apiService.machineId;
    this.url = this.apiService.url
    // this.initDemo();
    this.loadSaleList();
  }
  initDemo(){
    this.apiService.initDemo().subscribe(r=>{
      console.log(r);
      if(r.status){
        this.vendingOnSale = r.data;
      }
    })
  }
  loadPaidBills(){
    this.apiService.loadPaidBills().subscribe(r=>{
      console.log(r);
      if(r.status){
        this.vendingBillPaid = r.data;
      }
    })
  }
  loadBills(){
    this.apiService.loadBills().subscribe(r=>{
      console.log(r);
      if(r.status){
        this.vendingBill = r.data;
      }
    })
  }
  loadOnlineMachine(){
    this.apiService.loadOnlineMachine().subscribe(r=>{
      console.log(r);
      if(r.status){
        this.onlineMachines = r.data;
      }
    })
  }
  loadSaleList(){
    this.apiService.loadSaleList().subscribe(r=>{
      console.log(r);
      if(r.status){
        this.vendingOnSale = r.data;
      }
    })
  }
  buyMMoney(id:number){
    const x = this.vendingOnSale.find(v=>v.id==id);
    if(!x) return alert('not found');

    this.apiService.buyMMoney([id],x.stock.price,this.machineId.machineId).subscribe(r=>{
      console.log(r);
      if(r.status){
        this.mMoneyRes = r.data;
      }
    })
  }
  buyManyMMoney(){
    if(!this.orders.length) alert('Please add any items first');
    this.apiService.buyMMoney([...new Set(this.orders.map(v=>v.id))],this.orders.map(v=>v.stock.price).reduce((a,b)=>a+b,0),this.machineId.machineId).subscribe(r=>{
      console.log(r);
      if(r.status){
        this.mMoneyRes = r.data;
        localStorage.setItem('order',JSON.stringify(this.mMoneyRes));
      }
    })
  }
  
  addOrder(id:number){
    const x = this.vendingOnSale.find(v=>v.id==id);
    if(!x) return alert('not found');
    const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
    y.stock.qtty=1;
    this.orders.push(x);
  }
  summarizeOrder(){
    const o = new Array<IVendingMachineSale>();
    this.orders.forEach(v=>{
      const x = o.find(x=>x.id==v.id);
      if(!x) o.push(JSON.parse(JSON.stringify(v))) ;
      else x.stock.qtty+=1
    })
    return o;
  }
  getSaleList(){
    const x = new Array<Array<IVendingMachineSale>>();
    this.vendingOnSale.forEach((v,i)=>{
      const y = i+1;
      if(y%2)x.push(this.vendingOnSale.slice(i-1,i))
    })
    return x;
  }

}
