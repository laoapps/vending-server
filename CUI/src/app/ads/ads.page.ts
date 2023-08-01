import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { IAdsMedia } from '../services/syste.model';
import { IENMessage } from '../models/base.model';

@Component({
  selector: 'app-ads',
  templateUrl: './ads.page.html',
  styleUrls: ['./ads.page.scss'],
})
export class AdsPage implements OnInit {
  playList =new Array<IAdsMedia>();
  constructor(public apiService:ApiService,public modal:ModalController) { }
  introductionMedia ={name:'Introduction',description:'Introduction how to use and change',type:'video',url:''};


  adsList: Array<any> = [
    { name:'test',description:'test',type:'video',url:'../../assets/ads/1.webm' },
    { name:'test',description:'test',type:'image',url:'../../assets/ads/2.png' },
    { name:'test',description:'test',type:'image',url:'../../assets/ads/3.jpg' },
  ];
  count: number;
  videoPlayer: HTMLVideoElement = {} as any;

  
  introAdsObject: any = {} as any;
  slideInterval: number = 10000; // 10s

  // TODO: HERE
  ngOnInit() {

    this.videoPlayer = document.createElement('video');
    this.loadAdsList();


    // (document.querySelector('video') as HTMLVideoElement).play();
    // find exist ads id here 
    // this.playList.push(this.introductionMedia);
    // const adsIds =[]
    // this.apiService.loadAds(adsIds).subscribe(r=>{
    //   if(r.status){
    //     if(r.data.length){
    //       this.playList.length=0;
    //       this.playList.push(this.introductionMedia);
    //       // delete exist ads
    //       // add new ads
    //      this.playList.push(...r.data);
    //     }
    //   }
    //   this.apiService.simpleMessage(r.message);
    // });

  }

  loadAdsList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.count = this.adsList.length;
        if (this.count == 1) {
          this.introAdsObject = this.adsList[0];
          this.introAdsObject.time = 0;

          if (this.introAdsObject.type == 'video') {
            this.videoPlayer.src = this.introAdsObject.url;
            this.videoPlayer.addEventListener('loadedmetadata', event => {
            this.introAdsObject.time = Math.ceil(this.videoPlayer.duration) + 1000;
            });
          } else {
            this.introAdsObject.time = 50000;
          }

        } else if (this.count > 1) {

          for(let i = 0; i < this.adsList.length; i++) {
            this.adsList[i].time = 0;
            if (this.adsList[i].type == 'video') {
              this.videoPlayer.src = this.adsList[i].url;
              this.videoPlayer.addEventListener('loadedmetadata', event => {
              this.adsList[i].time = Math.ceil(this.videoPlayer.duration) + 1000;
              });
            } else {
              this.adsList[i].time = 50000;
            }
          }
          
        }

        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }



  exit(){
    this.modal.dismiss();
  }
}
