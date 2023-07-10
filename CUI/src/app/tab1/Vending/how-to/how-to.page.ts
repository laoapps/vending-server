import { Component, OnInit } from '@angular/core';
import { howToVideoJSON } from './video';
import { ApiService } from 'src/app/services/api.service';
import { Platform } from '@ionic/angular';
import { IENMessage } from 'src/app/models/base.model';
// import { VideoPlayer } from '@ionic-native/video-player/ngx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
 
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
    // private videoPlayer: VideoPlayer,
    private apiService: ApiService,
    private platform: Platform,
  ) { }

  ngOnInit() {
    

    this.lists = this.apiService.howtoVideoPlayList;
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

  testWriteFile() {
    const writeSecretFile = async () => {
      await Filesystem.writeFile({
        path: 'secrets/text.txt',
        data: 'This is a test',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    };
    
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

        // this.videoPlayer.play(this.currentPlay.video).then(() => {
        //   console.log('video completed');
        //   this.apiService.simpleMessage(`Video COMPLETE`, 10000);
        //   }).catch(err => {
        //   console.log(`video error`, err);
        //   this.apiService.simpleMessage(`Video ERROR`, 10000);
        // });

        // this.currentPlay.video = await this.apiService.convertLocalFilePath(this.currentPlay.video);

        // let i = setInterval(() => {
        //   const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
        //   howToPlayer.src = this.currentPlay.video;

        //   const autoPlayVideo = (document.querySelector('#auto-play-video') as HTMLInputElement);
        //   if (this.autoPlayVideo == true) {
        //     autoPlayVideo.checked = true;
        //     howToPlayer.src = this.currentPlay.video;
        //     howToPlayer.play();
        //   }
        //   clearInterval(i);

        // });
        // const howToPlayer = (document.querySelector('#how-to-player') as HTMLVideoElement);
        // howToPlayer.disablePictureInPicture = true;
        

        

        resolve(IENMessage.success);

        // let i = setInterval(() => {
        //   clearInterval(i);

        //   const autoPlayVideo = (document.querySelector('#auto-play-video') as HTMLInputElement);
        //   if (this.autoPlayVideo == true) {
        //     autoPlayVideo.checked = true;
        //     howToPlayer.src = this.currentPlay.video;
        //     howToPlayer.play();
        //   }
        // });


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

        const current = this.lists.filter(item => item.id == id)[0];
        if (current.video == undefined) throw new Error(IENMessage.notFoundFile);

        this.currentPlay.video = await this.apiService.convertLocalFilePath(current.video);
        this.currentPlay.title = current.title;
        this.currentPlay.subsubtitle = current.subtitle;

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
