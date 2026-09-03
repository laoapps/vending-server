import {
  Component,
  ElementRef,
  ViewChild,
  OnInit
} from '@angular/core';

import { VideoCacheService } from '../video-cache.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-ads',
  templateUrl: './ads.page.html',
  styleUrls: ['./ads.page.scss'],
})
export class AdsPage implements OnInit {

  @ViewChild('videoPlayer')
  videoPlayer!: ElementRef<HTMLVideoElement>;

  playlist: string[] = [];

  currentIndex = 0;

  currentSrc: string | null = null;

  constructor(
    private videoService: VideoCacheService,
    private navCtrl: NavController

  ) { }


  async ngOnInit() {

    this.initLoadLocal();
  }

  initLoadLocal() {
    try {
      const adsLocal = JSON.parse(localStorage.getItem('adsList') || '[]');
      this.playlist = adsLocal;
      if (adsLocal.length > 0) {
        this.playVideo(0);

      }

    } catch (error) {

    }
  }

  /**
   * เล่น video
   */
  async playVideo(index: number) {

    this.currentIndex = index;

    const url = this.playlist[index];

    this.cleanup();

    const localPath =
      await this.videoService.downloadIfNotExist(url);

    this.currentSrc =
      this.videoService.getPlayableUrl(localPath);


    setTimeout(() => {

      const video = this.videoPlayer.nativeElement;

      video.load();

      video.play()

    }, 100);

  }


  /**
   * auto play next
   */
  // async next() {

  //   this.currentIndex++;

  //   if (this.currentIndex >= this.playlist.length)
  //     this.currentIndex = 0;

  //   await this.playVideo(this.currentIndex);

  // }

  async next() {

    this.currentIndex++;

    // เล่นครบแล้ว
    if (this.currentIndex >= this.playlist.length) {

      this.closePage();

      return;

    }

    await this.playVideo(this.currentIndex);

  }

  closePage() {

    this.cleanup();

    this.navCtrl.back();
  }




  onEnded() {

    this.next();

  }


  /**
   * clear memory ป้องกัน crash
   */
  cleanup() {

    const video = this.videoPlayer?.nativeElement;

    if (!video) return;

    video.pause();

    video.removeAttribute('src');

    video.load();

  }


  /**
   * delete
   */
  async delete(url: string) {

    await this.videoService.deleteVideo(url);

  }

}
