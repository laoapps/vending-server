import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { AdsPage } from '../ads/ads.page';
import { ApiServiceService } from '../api-service.service';
import { IBankNote, IBillBankNote as IBillCashIn } from '../syste.model';
import { Animation, AnimationController } from '@ionic/angular';

var host = window.location.protocol + "//" + window.location.host;
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
  server_path=host;
  mmLogo = host + '/assets/icon/mmoney.png';
  billCashIn:Array<IBillCashIn>;
  bankNotes = new Array<IBankNote>();
  timer ={t:30};
  accountname='';
  accountRef='';
  sumBN={value:0};
  test={test:false}
  constructor(public apiService: ApiServiceService) {
    this.billCashIn = apiService.billCashIn;
    this.sumBN = apiService.sumBN;
    this.loadBankNotes();
    this.timer = apiService.timer;
   
   this.apiService.accountInfoSubcription.subscribe(r=>{
    console.log('R',r);
    if(r){
      this.accountname=r.accountNameEN;
      this.accountRef =r.accountRef;
    }
    
   })
   this.test=this.apiService.test;
  }

  refresh() {
    this.apiService.refresh();
  }
  loadBankNotes() {
    this.apiService.loadBankNotes().subscribe(r => {
      try {
        console.log('loadBankNotes', r);
        if (r.status) {
          this.bankNotes = r.data;
        }
        this.apiService.toast.create({ message: r.message, duration: 5000 }).then(v => {
          v.present();
        });
      } catch (error) {
        console.log(error);
        this.apiService.toast.create({ message: error.message, duration: 5000 }).then(v => {
          v.present();
        });
      }

    })
  }
}
