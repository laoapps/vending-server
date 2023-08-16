import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
export class RemainingbillsPage implements OnInit, OnDestroy {

  canclick: boolean = false;

  timer: any = {} as any;
  counter: number = localStorage.getItem('product_fall') ? Number(localStorage.getItem('product_fall')) : 0;
  counterLimit: number = localStorage.getItem('product_fall_limit') ? Number(localStorage.getItem('product_fall_limit')) : 10;

  @Input()r=new Array<IBillProcess>();
  url = this.apiService.url;
  constructor(public apiService:ApiService, private modal: ModalController) { 

  }

  async ngOnInit() {
    console.log('R',this.r);
    console.log(`here`);
    await this.apiService.soundPleaseSelect();
    
    if (this.counter > 0) {
      if (this.counter > this.counterLimit) this.counter = this.counterLimit;
      this.timer = setInterval(() => {
        this.counter--;
        if (this.counter <= 0) {
          clearInterval(this.timer);
          this.canclick = true;
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
      this.clearTimer();
  }
  findImage(id:number){
    return ApiService.vendingOnSale.find(vy=>vy.stock.id==id)?.stock?.image;
  }
  findPrice(id:number){
    return ApiService.vendingOnSale.find(vy=>vy.stock.id==id)?.stock?.price;
  }
  // local
  retryProcessBill(transactionID:string,position:number){
    console.log(`rrrrr`, this.r);

    if (this.canclick == true) {
      this.apiService.showLoading('',30000);
      const isRemote= localStorage.getItem('remoteProcess');
      if(!isRemote)
      this.apiService.retryProcessBillLocal(transactionID,position).subscribe(async r=>{
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
         
          if (count == 0) {
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
      })
      else

        if (this.counter == 0) {

          localStorage.setItem('product_fall', this.counterLimit.toString());
          this.counter = this.counterLimit;
          this.canclick = false;
          console.log(`transactionID`, transactionID, `position`, position, );



          this.apiService.retryProcessBill(transactionID,position).subscribe(async r=>{
            // this.apiService.dismissLoading();
            console.log(`vending on sale`, ApiService.vendingOnSale);
            console.log('retryProcessBill',r);
            if(r.status){
              this.apiService.soundThankYou()
              this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
                r.present();
              });

              this.apiService.loadDeliveryingBills().subscribe(async reload_ticket => {
                if (reload_ticket.status != 1) {
                  this.cancelTimer();
                  await this.apiService.soundSystemError();
                  return;
                }

                this.r = reload_ticket.data;
                console.log(`here der`, this.r);

                // let count: number = 0;
                // console.log(`lleng`, this.r);
                // if (this.r != undefined && Object.entries(this.r).length > 1) {
                //   count = this.r.length - 1;
                // } else {
                //   count = 0;
                // }
                // const i=this.r.findIndex(v=>v.position==position);
                // this.r.splice(i,1);
              
                if (this.r != undefined && Object.entries(this.r).length == 0) {
                  localStorage.setItem('product_fall', '0');
                  this.clearTimer();
                  this.apiService,this.modal.dismiss();
                }
  
                // this.apiService.modal.dismiss();
                // this.apiService.myTab1.reshowBills(count);
  
                if (this.counter == this.counterLimit) {
                  this.timer = setInterval(() => {
                    this.counter--;
                    localStorage.setItem('product_fall', this.counter.toString());
                    if (this.counter <= 0) {
                      this.canclick = true;
                      localStorage.setItem('product_fall', '0');
                      clearInterval(this.timer);
                    }
                  }, 1000);
                }
              }, async error => {
                this.cancelTimer();
                await this.apiService.soundSystemError();
              });
              
            } else{
              this.counter = 0;
              this.canclick = true;
              localStorage.setItem('product_fall', '0');
              this.clearTimer();
              await this.apiService.soundSystemError();
            }


            this.apiService.simpleMessage(r.message);

            setTimeout(()=>{
              this.apiService.dismissLoading();
            },3000)

          }, async error => {
            setTimeout(()=>{
              this.apiService.dismissLoading();
            },3000)
            this.clearTimer();
            await this.apiService.soundSystemError();
          }); 
        }
    }
  }
  // remote
  // retryProcessBill(transactionID:string,position:number){
  //   if (this.canclick == true) {
  //     this.apiService.showLoading('',30000);
  //     this.apiService.retryProcessBill(transactionID,position).subscribe(async r=>{
  //       console.log(`vending on sale`, ApiService.vendingOnSale);
  //       console.log('retryProcessBill',r);
  //       if(r.status){
  //         this.apiService.soundThankYou()
  //         this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
  //           r.present();
  //         });
  //         let count: number = 0;
  //         console.log(`lleng`, this.r);
  //         if (this.r != undefined && Object.entries(this.r).length > 1) {
  //           count = this.r.length - 1;
  //         } else {
  //           count = 0;
  //         }
  //         const i=this.r.findIndex(v=>v.position==position);
  //         this.r.splice(i,1);
         
  //         if (this.r != undefined && this.r.length == 0) {
  //           this.apiService,this.modal.dismiss();
  //         }
  //         // this.apiService.modal.dismiss();
  //         // this.apiService.myTab1.reshowBills(count);
  //       } else{
  //         await this.apiService.soundSystemError();
  //       }
  //       this.apiService.simpleMessage(r.message);
  //       setTimeout(()=>{
  //         this.apiService.dismissLoading();
  //       },3000)
        
  //     }); 
  //   }
  // }
  getPrice() {
    return this.r.find(item => item)
  }
  getStock(position:number){
    return this.r.map(v=>v.bill.vendingsales)[0].find(v=>v.position==position)?.stock;
  }
  closeToolTip(){
    (document.querySelector('.tooltip-background') as HTMLDivElement).classList.remove('active');
    (document.querySelector('.hand-click') as HTMLDivElement).classList.remove('active');

    if (this.counter == 0) {
      this.canclick = true;
    }
  }

  close() {
    this.clearTimer();
    this.apiService.modal.dismiss();
  }
  clearTimer() {
    clearInterval(this.timer);
  }
  cancelTimer() {
    this.counter = 0;
    this.canclick = true;
    localStorage.setItem('product_fall', '0');
    this.clearTimer();
  }
  
}
