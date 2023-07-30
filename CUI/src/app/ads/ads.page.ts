import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { IAdsMedia } from '../services/syste.model';

@Component({
  selector: 'app-ads',
  templateUrl: './ads.page.html',
  styleUrls: ['./ads.page.scss'],
})
export class AdsPage implements OnInit {
  playList =new Array<IAdsMedia>();
  constructor(public apiService:ApiService,public modal:ModalController) { }
  introductionMedia ={name:'Introduction',description:'Introduction how to use and change',type:'video',url:''};
  // TODO: HERE
  ngOnInit() {
    // find exist ads id here 
    this.playList.push(this.introductionMedia);
    const adsIds =[]
    this.apiService.loadAds(adsIds).subscribe(r=>{
      if(r.status){
        if(r.data.length){
          this.playList.length=0;
          this.playList.push(this.introductionMedia);
          // delete exist ads
          // add new ads
         this.playList.push(...r.data);
        }
      }
      this.apiService.simpleMessage(r.message);
    });
  }
  exit(){
    this.modal.dismiss();
  }
}
