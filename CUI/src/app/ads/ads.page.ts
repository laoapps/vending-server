import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { IAdsMedia } from '../services/syste.model';
import { IENMessage } from '../models/base.model';

@Component({
  selector: 'app-ads',
  templateUrl: './ads.page.html',
  styleUrls: ['./ads.page.scss'],
})
export class AdsPage implements OnInit, OnDestroy {
  playList =new Array<IAdsMedia>();
  constructor(public apiService:ApiService,public modal:ModalController) { }
  introductionMedia ={name:'Introduction',description:'Introduction how to use and change',type:'video',url:''};

  videoPlayer: HTMLVideoElement = {} as any;

  activeAdsList: any = {} as any;
  adsList: Array<any> = [
    { id: 1, name:'test',description:'test',type:'video',url:'../../assets/ads/howtouseepin.webm' },
    { id: 2, name:'test',description:'test',type:'video',url:'../../assets/ads/howto1.webm' },
    { id: 3, name:'test',description:'test',type:'video',url:'../../assets/ads/howto2.webm' },
    { id: 4, name:'test',description:'test',type:'video',url:'../../assets/ads/howto3.webm' },
  ];

  loop: any = {} as any;
  currentType: string;
  currentUrl: string;


  // TODO: HERE
  ngOnInit() {


    this.videoPlayer = document.createElement('video');
    this.loadAds();
  }
  ngOnDestroy(): void {
      if (this.loop) {
        clearInterval(this.loop);
      }
  }

  loadAds(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.currentType = this.adsList[0].type;
        this.currentUrl = this.adsList[0].url;
        if (this.currentType == 'video') {
          let reload = setInterval(() => {
            clearInterval(reload);
            (document.querySelector('.ads-video') as HTMLVideoElement)?.play();
          });
        }
        let count: number = 0;

        this.loop = setInterval(() => {
          if (count == this.adsList.length - 1) {
            clearInterval(this.loop);
            this.modal.dismiss();
            count = -1;
          } else {

            if (this.currentType == 'video') {
              let reload = setInterval(() => {
                clearInterval(reload);
                (document.querySelector('.ads-video') as HTMLVideoElement)?.pause();
              });
            }

            if (count == -1) count = 0;
            else count++;
            
            this.currentType = this.adsList[count].type;
            this.currentUrl = this.adsList[count].url;
            if (this.currentType == 'video') {
              let reload = setInterval(() => {
                clearInterval(reload);
                (document.querySelector('.ads-video') as HTMLVideoElement)?.play();
              });
            }
          }


        }, 30000);
      
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }

  exit(){
    if (this.loop) {
      clearInterval(this.loop);
    }
    this.modal.dismiss();
  }
}
