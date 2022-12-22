import { Component, OnInit } from '@angular/core';
import { ApiServiceService } from '../api-service.service';
import { NumberpadPage } from '../numberpad/numberpad.page';
import { EMessage } from '../syste.model';
import { loadingController } from '@ionic/core';

@Component({
  selector: 'app-phonenumber',
  templateUrl: './phonenumber.page.html',
  styleUrls: ['./phonenumber.page.scss'],
})
export class PhonenumberPage implements OnInit {
  phonenumber={phonenumber:'2055516321'};
  test={test:false}
  sent=false;
  constructor(public api:ApiServiceService) {
    this.phonenumber.phonenumber=api.pn;
   }

  ngOnInit() {
    this.test=this.api.test;
  }

 async start(){
    if(this.sent)return;

    this.sent= true;
    const l = await loadingController.create({duration:10000});
    l.present();
    this.phonenumber.phonenumber=this.api.pn
    console.log(this.phonenumber);
    
    if((this.phonenumber.phonenumber+'').length<10){
      this.api.toast.create({message:EMessage.phonenumberisempty,duration:3000}).then(x=>{
        x.present();
      })
      this.sent =false;
      l.dismiss();
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
      this.api.pn='';
      l.dismiss();
      this.sent =false;
    })
  }
  close(){
    this.api.closeModal();
    this.api.pn='';
  }
  showPad(){
    this.api.showModal(NumberpadPage).then(r=>{
      r.present()
    })
  }
}
