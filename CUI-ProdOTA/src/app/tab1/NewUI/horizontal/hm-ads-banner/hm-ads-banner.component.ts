import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCacheService } from 'src/app/video-cache.service';

@Component({
  selector: 'app-hm-ads-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hm-ads-banner.component.html',
  styleUrls: ['./hm-ads-banner.component.scss'],
})
export class HmAdsBannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  playlist: string[] = [];
  currentIndex = 0;
  currentSrc: string | null = null;
  contact = localStorage.getItem('contact') || '55516321';

  constructor(private videoService: VideoCacheService) { }

async ngOnInit() {
  this.playlist = JSON.parse(localStorage.getItem('adsList') || '[]');
  await this.videoService.preloadAll(this.playlist); // not fire-and-forget
  if (this.playlist.length) this.playVideo(0);
}

  ngOnDestroy(): void {
    this.cleanup();
  }

  async playVideo(index: number): Promise<void> {
    if (!this.playlist.length) return;
    this.currentIndex = index % this.playlist.length;
    const url = this.playlist[this.currentIndex];
    this.cleanup();
    try {
      const localPath = await this.videoService.downloadIfNotExist(url);
      this.currentSrc = this.videoService.getPlayableUrl(localPath);
    } catch {
      this.playVideo(this.currentIndex + 1); // skip missing clip
      return;
    }
    setTimeout(() => {
      const video = this.videoPlayer?.nativeElement;
      if (!video) return;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');
      video.controls = false;
      (video as any).disablePictureInPicture = true;
      video.load();
      video.play().catch(() => { });
      const exitFs = () => {
        try {
          (video as any).webkitExitFullscreen?.();
          document.exitFullscreen?.();
        } catch { }
      };
      video.addEventListener('webkitbeginfullscreen', (e) => {
        e.preventDefault();
        exitFs();
      });
      video.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === video) exitFs();
      });
    }, 80);
  }

  onEnded(): void {
    this.playVideo(this.currentIndex + 1);
  }

  cleanup(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch { }
  }
}