import { Component, Input, OnInit } from '@angular/core';
import { IBillProcess } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { Tab1Page } from '../tab1/tab1.page';
import { IENMessage } from '../models/base.model';

@Component({
  selector: 'app-remainingbills',
  templateUrl: './remainingbills.page.html',
  styleUrls: ['./remainingbills.page.scss'],
})
export class RemainingbillsPage implements OnInit {

  canclick: boolean = false;

  @Input()r=new Array<IBillProcess>();
  url = this.apiService.url;
  constructor(public apiService:ApiService, private modal: ModalController) { 

  }

  async ngOnInit() {
    console.log('R',this.r);
    console.log(`here`);
    await this.apiService.soundPleaseSelect();
  }
  findImage(id:number){
    return ApiService.vendingOnSale.find(vy=>vy.stock.id==id)?.stock?.image;
  }
  findPrice(id:number){
    return ApiService.vendingOnSale.find(vy=>vy.stock.id==id)?.stock?.price;
  }
  retryProcessBill(transactionID:string,position:number){
    if (this.canclick == true) {
      this.apiService.showLoading('',30000);
      this.apiService.retryProcessBill(transactionID,position).subscribe(async r=>{
        console.log(`vending on sale`, ApiService.vendingOnSale);
        console.log('retryProcessBill',r);
        if(r.status){
          this.apiService.soundThankYou()
          this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
            r.present();
          });
          let count: number = 0;
          console.log(`lleng`, this.r);
          if (this.r != undefined && Object.entries(this.r).length > 1) {
            count = this.r.length - 1;
          } else {
            count = 0;
          }
          const i=this.r.findIndex(v=>v.position==position);
          this.r.splice(i,1);
         
          if (this.r != undefined && this.r.length == 0) {
            this.apiService,this.modal.dismiss();
          }
          // this.apiService.modal.dismiss();
          // this.apiService.myTab1.reshowBills(count);
        } else{
          await this.apiService.soundSystemError();
        }
        this.apiService.simpleMessage(r.message);
        setTimeout(()=>{
          this.apiService.dismissLoading();
        },3000)
        
      }); 
    }
  }
  getPrice() {
    return this.r.find(item => item)
  }
  getStock(position:number){
    return this.r.map(v=>v.bill.vendingsales)[0].find(v=>v.position==position)?.stock;
  }
  closeToolTip(){
    this.canclick = true;
    (document.querySelector('.tooltip-background') as HTMLDivElement).classList.remove('active');
    (document.querySelector('.hand-click') as HTMLDivElement).classList.remove('active');
  }

  close() {
    this.apiService.modal.dismiss();
  }
  
}
