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
  constructor(public apiService:ApiService) { }

  ngOnInit() {
  }
  retryProcessBill(transactionID:string,position:number){
    this.apiService.retryProcessBill(transactionID,position).subscribe(r=>{
      console.log('retryProcessBill',r);
      if(r.status){
        
      }
      this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
        r.present();
      })
    })
  }
}
