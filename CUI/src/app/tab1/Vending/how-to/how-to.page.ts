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
      this.autoPlayVideo = false;
      localStorage.setItem('vending_guid', JSON.stringify({ auto_play_video: false }));

    } else 
    {
      this.autoPlayVideo = JSON.parse(local).auto_play_video;
    }
  }
  loadCurrentPlay() {
    this.currentPlay = this.lists[0];
    const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
    howToPlayer.disablePictureInPicture = true;

    let i = setInterval(() => {
      const autoPlayVideo = (document.querySelector('#auto-play-video') as HTMLInputElement);
        clearInterval(i);
        if (this.autoPlayVideo == true) {
          autoPlayVideo.checked = true;
          howToPlayer.play();
        }
    });

  }
  selectCurrentPlay(video: string) {
    const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
    howToPlayer.src = video;
    howToPlayer.play();
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
