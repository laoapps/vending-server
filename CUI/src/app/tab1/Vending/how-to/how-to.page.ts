import { Component, OnInit } from '@angular/core';
import { howToVideoJSON } from './video';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-how-to',
  templateUrl: './how-to.page.html',
  styleUrls: ['./how-to.page.scss'],
})
export class HowToPage implements OnInit {

  currentPlay: any = {} as any;
  autoFullScreen: boolean = false;
  autoPlayVideo: boolean = false;  
  lists: Array<any> = howToVideoJSON;

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadAutoPlayState();
    this.loadCurrentPlay();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  loadAutoPlayState() {
    const local = localStorage.getItem('vending_guid');
    if (local == undefined || local == null) {
      this.autoFullScreen = false;
      this.autoPlayVideo = false;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: false, auto_full_screen: false }));
    } else 
    {
      this.autoPlayVideo = JSON.parse(local).auto_play_video;
      this.autoFullScreen = JSON.parse(local).auto_full_screen;
    }
  }
  loadCurrentPlay() {
    this.currentPlay = this.lists[0];
    const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);


    let i = setInterval(() => {
      const autoFullScreen = (document.querySelector('#auto-full-screen') as HTMLInputElement);
      const autoPlayVideo = (document.querySelector('#auto-play-video') as HTMLInputElement);
      if (autoFullScreen != undefined || autoFullScreen != null && autoPlayVideo != undefined || autoPlayVideo != null) {
        clearInterval(i);
        if (this.autoFullScreen == true) {
          autoFullScreen.checked = true;
          howToPlayer.requestFullscreen();
        }
        if (this.autoPlayVideo == true) {
          autoPlayVideo.checked = true;
          howToPlayer.play();
        }
      }
    });

  }
  selectCurrentPlay(video: string) {
    const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
    howToPlayer.src = video;

    if (this.autoFullScreen == true) {
      howToPlayer.requestFullscreen();
    }
    howToPlayer.play();
  }

  toggleAutoFullScreen() {
    const local = localStorage.getItem('vending_guid');
    const parseLocal = JSON.parse(local);

    if (this.autoFullScreen == true) {
      this.autoFullScreen = false;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: parseLocal.auto_play_video, auto_full_screen: false }));
    } else {
      this.autoFullScreen = true;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: parseLocal.auto_play_video, auto_full_screen: true }));
    }
  }
  toggleAutoPlayVideo() {
    const local = localStorage.getItem('vending_guid');
    const parseLocal = JSON.parse(local);

    if (this.autoPlayVideo == true) {
      this.autoPlayVideo = false;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: false, auto_full_screen: parseLocal.auto_full_screen }));
    } else {
      this.autoPlayVideo = true;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: true, auto_full_screen: parseLocal.auto_full_screen }));
    }
  }
  
  toggleBtnCloseFullScreen() {
    // let i = setInterval(() => {
    //   const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
    //   if (howToPlayer != undefined && howToPlayer != null) {
    //     clearInterval(i);
    //     howToPlayer.on
    //   }
    //  });
  }
  showFullScreen() {
    this.apiService.simpleMessage(`FULL SCREEN MODE`);
    const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
    howToPlayer.requestFullscreen();
  }
}
