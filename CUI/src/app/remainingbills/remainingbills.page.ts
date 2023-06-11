import { Component, Input, OnInit } from '@angular/core';
import { IBillProcess } from '../services/syste.model';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-remainingbills',
  templateUrl: './remainingbills.page.html',
  styleUrls: ['./remainingbills.page.scss'],
})
export class RemainingbillsPage implements OnInit {
  @Input()r=new Array<IBillProcess>();
  url = this.apiService.url;
  constructor(public apiService:ApiService) { 

  }

  ngOnInit() {
    console.log('R',this.r);
    
    // this.r.forEach(v=>{
    //   v.bill.vendingsales.forEach(vx=>vx.stock.image=this.apiService.vendingOnSale.find(vy=>vy.stock.id==vx.stock.id)?.stock?.image)
    // })
  }
  findImage(id:number){
    return this.apiService.vendingOnSale.find(vy=>vy.stock.id==id)?.stock?.image;
  }
  retryProcessBill(transactionID:string,position:number){
    this.apiService.retryProcessBill(transactionID,position).subscribe(r=>{
      console.log('retryProcessBill',r);
      if(r.status){
       console.log('retry ok',r.data);
       
      }
      this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
        r.present();
      })
    })
  }
  getStock(position:number){
    return this.r.map(v=>v.bill.vendingsales)[0].find(v=>v.position==position)?.stock;
  }
}
