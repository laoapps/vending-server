import { Component, OnInit } from '@angular/core';
import { ApiServiceService } from '../api-service.service';
import { EMessage } from '../syste.model';

@Component({
  selector: 'app-phonenumber',
  templateUrl: './phonenumber.page.html',
  styleUrls: ['./phonenumber.page.scss'],
})
export class PhonenumberPage implements OnInit {
  phonenumber={phonenumber:'2055516321'}
  constructor(public api:ApiServiceService) { }

  ngOnInit() {
  }
  start(){
    if((this.phonenumber.phonenumber+'').length<8){
      this.api.toast.create({message:EMessage.phonenumberisempty,duration:3000}).then(x=>{
        x.present();
      })
      return;
    }
    this.api.validateMMoney(this.phonenumber.phonenumber).subscribe(r=>{
      console.log('R',r);
      if(r.status){
        if(r.data.responseStatus=='ERROR'){
          this.api.toast.create({message:r.data.responseMessage,duration:3000}).then(x=>{
            x.present();
          })
        }else{
          Object.keys(r.data).forEach(k=>{
            this.api.mMoneyRequestor[k]=r.data[k];
          })
          this.api.accountInfoSubcription.next({accountNameEN:this.api.mMoneyRequestor.transData[0].accountNameEN,accountRef:this.api.mMoneyRequestor.transData[0].accountRef})
          this.api.connectWS();
          this.api.closeModal();
          
        }
       
      }
      
    })
  }
  close(){
    this.api.closeModal();
  }
}
