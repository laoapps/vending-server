import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { DomSanitizer } from '@angular/platform-browser';
import { IVideoList } from '../services/service';
import { ModalController } from '@ionic/angular';
// import { FullscreenPage } from '../fullscreen/fullscreen.page';
// import { VideoPlayer } from '@awesome-cordova-plugins/video-player/ngx';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.page.html',
  styleUrls: ['./howto.page.scss'],
})
export class HowtoPage implements OnInit {
  // trustedVideoUrl: SafeResourceUrl;
  list = new Array<IVideoList>();
  host = window.location.protocol + "//" + window.location.host;
  constructor(public apiService:ApiService,public modalCtrl: ModalController,
    // private videoPlayer: VideoPlayer
    ) { }


  ionViewWillEnter(): void {
    this.list.push({name:'How To 1',title:'How To 1',description:'How To 1',url:'assets/video-how-to/howto3.mov',image:'',id:0})
    this.list.push({name:'How To 2',title:'How To 2',description:'How To 2',url:'assets/video-how-to/howto2.mov',image:'',id:1})
    this.list.push({name:'How To 3',title:'How To 3',description:'How To 3',url:'assets/video-how-to/howto1.mov',image:'',id:2})
    // this.list.push({name:'demo4',title:'demo4',description:'demo4',url:'assets/how-to-video/demo.mp4',image:'',id:0})
    // this.apiService.loadHowTo().subscribe(r=>{

    // });
    // for(let i of this.list){
    //   // i.youtubeURL = this.domSanitizer.bypassSecurityTrustResourceUrl(i.youtubeURL);
    // }
  } 
  close() {
    this.apiService.modalCtrl.dismiss();
  }


  

  ngOnInit(): void {
    // auto play first video
    // setTimeout(() => {
    //   this.testVideoPlayerPlugin('assets/howtovideo/demo.mp4');
    // }, 3000);
    
  }
  

}
