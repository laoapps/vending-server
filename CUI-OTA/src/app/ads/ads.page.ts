import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { IAdsMedia } from '../services/syste.model';
import { IENMessage } from '../models/base.model';
import { VideoCacheService } from '../video-cache.service';

@Component({
    selector: 'app-ads',
    templateUrl: './ads.page.html',
    styleUrls: ['./ads.page.scss'],
    standalone: false
})
export class AdsPage implements OnInit, OnDestroy {
  playList = new Array<IAdsMedia>();
  constructor(public apiService: ApiService, public modal: ModalController, private videoCacheService: VideoCacheService) { }
  introductionMedia = { name: 'Introduction', description: 'Introduction how to use and change', type: 'video', url: '' };

  videoPlayer: HTMLVideoElement = {} as any;

  activeAdsList: any = {} as any;
  adsList: Array<any> = [
    // { id: 1, name: 'test', description: 'test', type: 'video', url: '../../assets/ads/howtouseepin.webm' },
    // { id: 2, name: 'test', description: 'test', type: 'video', url: '../../assets/ads/howto1.webm' },
    // { id: 3, name: 'test', description: 'test', type: 'video', url: '../../assets/ads/howto2.webm' },
    // { id: 4, name: 'test', description: 'test', type: 'video', url: '../../assets/ads/howto3.webm' },
  ];

  loop: any = {} as any;
  // currentType: string;
  // currentUrl: string;

  currentIndex: number = 0;
  currentType: string = 'video';
  currentUrl: string = '';


  // TODO: HERE
  ngOnInit() {
    this.loadInitialAds();

    // this.videoPlayer = document.createElement('video');

    this.playCurrentAd();

    // this.loadAds();
  }

  loadInitialAds() {
    const adsLocal = JSON.parse(localStorage.getItem('adsList') || '[]');
    for (let index = 0; index < adsLocal.length; index++) {
      const element = adsLocal[index];
      this.adsList.push(
        { id: index + 1, name: 'test', description: 'test', type: 'video', url: element }
      );
    }
    console.log('adsList', this.adsList);

  }
  ngOnDestroy(): void {
    this.clearListeners();
    if (this.loop) {
      clearInterval(this.loop);
    }
  }

  clearListeners() {
    const video = document.querySelector('.ads-video') as HTMLVideoElement;
    if (video) video.onended = null;
  }

  async playCurrentAd() {
    if (this.currentIndex >= this.adsList.length) {
      this.modal.dismiss();
      return;
    }

    const currentAd = this.adsList[this.currentIndex];
    this.currentType = currentAd.type;

    if (currentAd.type === 'video') {
      try {
        const base64 = await this.videoCacheService.getCachedVideoBase64(currentAd.url);
        this.currentUrl = base64;

        setTimeout(() => {
          const video = document.querySelector('.ads-video') as HTMLVideoElement;
          if (video) {
            video.volume = this.apiService.musicVolume / 100;
            video.play();
            video.onended = () => {
              this.currentIndex++;
              this.playCurrentAd();
            };
          }
        }, 500);
      } catch (err) {
        console.error('Failed to load video:', err);
        this.currentIndex++;
        this.playCurrentAd(); // skip to next
      }
    }
  }

  exit() {
    this.clearListeners();
    this.modal.dismiss();
  }

  // loadAds(): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     try {

  //       this.currentType = this.adsList[0].type;
  //       this.currentUrl = this.adsList[0].url;
  //       if (this.currentType == 'video') {
  //         let reload = setInterval(() => {
  //           clearInterval(reload);
  //           (document.querySelector('.ads-video') as HTMLVideoElement).volume = this.apiService.musicVolume / 100;
  //           (document.querySelector('.ads-video') as HTMLVideoElement)?.play();
  //         });
  //       }
  //       let count: number = 0;

  //       this.loop = setInterval(() => {
  //         if (count == this.adsList.length - 1) {
  //           clearInterval(this.loop);
  //           this.modal.dismiss();
  //           count = -1;
  //         } else {

  //           if (this.currentType == 'video') {
  //             let reload = setInterval(() => {
  //               clearInterval(reload);
  //               (document.querySelector('.ads-video') as HTMLVideoElement)?.pause();
  //             });
  //           }

  //           if (count == -1) count = 0;
  //           else count++;

  //           this.currentType = this.adsList[count].type;
  //           this.currentUrl = this.adsList[count].url;
  //           if (this.currentType == 'video') {
  //             let reload = setInterval(() => {
  //               clearInterval(reload);
  //               (document.querySelector('.ads-video') as HTMLVideoElement).volume = this.apiService.musicVolume / 100;
  //               (document.querySelector('.ads-video') as HTMLVideoElement)?.play();
  //             });
  //           }
  //         }


  //       }, 30000);

  //       resolve(IENMessage.success);

  //     } catch (error) {
  //       this.apiService.simpleMessage(error.message);
  //       resolve(error.message);
  //     }
  //   });
  // }

  // exit() {
  //   if (this.loop) {
  //     clearInterval(this.loop);
  //   }
  //   this.modal.dismiss();
  // }
}
