import { Component, OnInit } from '@angular/core';
import { howToVideoJSON } from './video';
import { ApiService } from 'src/app/services/api.service';
import { Platform } from '@ionic/angular';
import { IENMessage } from 'src/app/models/base.model';

@Component({
  selector: 'app-how-to',
  templateUrl: './how-to.page.html',
  styleUrls: ['./how-to.page.scss'],
})
export class HowToPage implements OnInit {

  currentPlay: any = {} as any;
  autoPlayVideo: boolean = false;  
  lists: Array<any> = [];

  constructor(
    private apiService: ApiService,
    private platform: Platform,
  ) { }

  ngOnInit() {
    this.lists = this.apiService.howtoVideoPlayList;
    this.loadAutoPlayState();
    this.loadCurrentPlay();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  loadAutoPlayState() {
    const local = localStorage.getItem('vending_guid');
    if (local == undefined || local == null) {
      this.autoPlayVideo = false;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: false }));

    } else 
    {
      this.autoPlayVideo = JSON.parse(local).auto_play_video;
    }
  }
  loadCurrentPlay(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
        howToPlayer.disablePictureInPicture = true;
        
        const path = this.lists[0].video;
        this.currentPlay = await this.apiService.convertLocalFilePath(path);

        let i = setInterval(() => {
          clearInterval(i);

          const autoPlayVideo = (document.querySelector('#auto-play-video') as HTMLInputElement);
          if (this.autoPlayVideo == true) {
            autoPlayVideo.checked = true;
            howToPlayer.play();
          }
        });


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  selectCurrentPlay(id: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);

        const path = this.lists.filter(item => item.id == id)[0].video;
        if (path == undefined) throw new Error(IENMessage.notFoundFile);

        howToPlayer.src = await this.apiService.convertLocalFilePath(path);
        howToPlayer.play();
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  toggleAutoPlayVideo() {
    if (this.autoPlayVideo == true) {
      this.autoPlayVideo = false;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: false }));
    } else {
      this.autoPlayVideo = true;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: true }));
      (document.querySelector('#how-to-player') as HTMLVideoElement).play();
    }
  }
}
