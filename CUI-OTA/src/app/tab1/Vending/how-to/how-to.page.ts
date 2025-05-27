import { Component, OnInit } from '@angular/core';
import { howToVideoJSON } from './video';
import { ApiService } from 'src/app/services/api.service';
import { ModalController, Platform } from '@ionic/angular';
import { IENMessage } from 'src/app/models/base.model';
// import { VideoPlayer } from '@ionic-native/video-player/ngx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
 
@Component({
    selector: 'app-how-to',
    templateUrl: './how-to.page.html',
    styleUrls: ['./how-to.page.scss'],
    standalone: false
})
export class HowToPage implements OnInit {

  currentPlay: any = {} as any;
  autoPlayVideo: boolean = false;  
  lists: Array<any> = [];
  currentPlaying: boolean = false;

  constructor(
    // private videoPlayer: VideoPlayer,
    public apiService: ApiService,
    private platform: Platform,
    public modal: ModalController
  ) { 
    this.apiService.___HowToPage = this.modal;

  }

  ngOnInit() {
    this.apiService.autopilot.auto=0;

    this.lists = JSON.parse(JSON.stringify(this.apiService.howtoVideoPlayList));
    this.loadAutoPlayState();
    this.loadCurrentPlay();

    // if(!this.platform.is('capacitor')){
    //   this.lists = this.apiService.howtoVideoPlayList;
    //     this.loadAutoPlayState();
    //     this.loadCurrentPlay();
    //  }else{
      
    //  }
    // this.platform.ready().then(() => {
    //   setTimeout(() => {
    //     this.lists = this.apiService.howtoVideoPlayList;
    //     this.loadAutoPlayState();
    //     this.loadCurrentPlay();
    //   }, 1000);
     
    // });
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
        this.currentPlay = this.lists[0];
        const howToPlayerCover = (document.querySelector('#how-to-player-cover') as HTMLVideoElement);

        let i = setInterval(() => {
          const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
          const autoPlayVideo = (document.querySelector('#auto-play-video') as HTMLInputElement);
          howToPlayer.src = this.currentPlay.video;

          howToPlayerCover.addEventListener('click', () => {
            if (this.currentPlaying == false) {
              howToPlayerCover.classList.remove('active');
              howToPlayer.classList.add('active');
              howToPlayer.play();
            }
          });

          if (this.autoPlayVideo == true) {
            autoPlayVideo.checked = true;
            howToPlayer.src = this.currentPlay.video;
            setTimeout(() => {
              howToPlayer.classList.add('active');
              howToPlayerCover.classList.remove('active');
              this.currentPlaying = true;
            }, 1000);

            howToPlayer.play();
          }
          clearInterval(i);

        });


        resolve(IENMessage.success);

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
        const howToPlayerCover = (document.querySelector('#how-to-player-cover') as HTMLVideoElement);

        const current = this.lists.filter(item => item.id == id)[0];
        if (current.video == undefined) throw new Error(IENMessage.notFoundFile);
        this.currentPlay = current;

        howToPlayer.classList.remove('active');
        howToPlayerCover.classList.add('active');
        howToPlayerCover.src = this.currentPlay.cover;
        howToPlayer.src = this.currentPlay.video;
        howToPlayer.load();
        howToPlayer.play();
        
        setTimeout(() => {
          howToPlayer.classList.add('active');
          howToPlayerCover.classList.remove('active');
        }, 1000);


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
