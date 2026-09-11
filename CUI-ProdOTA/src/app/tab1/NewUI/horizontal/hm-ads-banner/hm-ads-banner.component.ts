import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCacheService } from 'src/app/video-cache.service';
import { ApiService } from 'src/app/services/api.service';
import { downloadFileUrl, downloadPhotoUrl } from 'src/app/filemanager-url';

const BANNER_HOLD_MS = 6500;
const BANNER_ANIM_MS = 1200;

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

  bannerItems: string[] = [];
  bannerIndex = 0;
  bannerSrc = '';
  bannerPrevSrc = '';
  bannerAnimating = false;

  private playToken = 0;
  private activePlayable: string | null = null;
  private boundExitFs: (() => void) | null = null;
  private boundFullscreenChange: (() => void) | null = null;
  private failStreak = 0;
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  private listPoll: ReturnType<typeof setInterval> | null = null;

  constructor(
    private videoService: VideoCacheService,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    try {
      this.playlist = JSON.parse(localStorage.getItem('adsList') || '[]');
    } catch {
      this.playlist = [];
    }
    this.reloadBanners(true);
    if (this.playlist.length) {
      void this.playVideo(0);
    }
    void this.videoService.preloadAll(this.playlist);
    this.listPoll = setInterval(() => this.reloadBanners(false), 8000);
  }

  ngOnDestroy(): void {
    this.playToken++;
    this.stopBannerTimer();
    if (this.listPoll) {
      clearInterval(this.listPoll);
      this.listPoll = null;
    }
    this.cleanup();
  }

  async playVideo(index: number): Promise<void> {
    if (!this.playlist.length) return;
    const token = ++this.playToken;
    this.currentIndex = ((index % this.playlist.length) + this.playlist.length) % this.playlist.length;
    const url = this.playlist[this.currentIndex];

    this.detachListeners();
    this.pauseElement();

    let playable = '';
    try {
      playable = await this.videoService.resolvePlayable(url);
    } catch {
      if (token !== this.playToken) return;
      this.failStreak++;
      if (this.failStreak >= this.playlist.length) {
        this.failStreak = 0;
        return;
      }
      await this.playVideo(this.currentIndex + 1);
      return;
    }

    if (token !== this.playToken) {
      this.videoService.releasePlayable(playable);
      return;
    }

    this.failStreak = 0;
    if (this.activePlayable && this.activePlayable !== playable) {
      this.videoService.releasePlayable(this.activePlayable);
    }
    this.videoService.releaseAllBlobsExcept(playable);
    this.activePlayable = playable;
    this.currentSrc = playable;

    setTimeout(() => {
      if (token !== this.playToken) return;
      const video = this.videoPlayer?.nativeElement;
      if (!video) return;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');
      video.controls = false;
      (video as any).disablePictureInPicture = true;
      this.attachListeners(video);
      video.load();
      video.play().catch(() => {});
    }, 50);
  }

  onEnded(): void {
    this.playVideo(this.currentIndex + 1);
  }

  onBannerError(): void {
    if (this.bannerItems.length <= 1) {
      this.bannerSrc = '';
      return;
    }
    this.advanceBanner();
  }

  cleanup(): void {
    this.detachListeners();
    this.pauseElement();
    if (this.activePlayable) {
      this.videoService.releasePlayable(this.activePlayable);
      this.activePlayable = null;
    }
    this.currentSrc = null;
  }

  private reloadBanners(forceRestart: boolean): void {
    let next: string[] = [];
    try {
      if (Array.isArray(this.api.bannerList) && this.api.bannerList.length) {
        next = this.api.bannerList.map((x) => String(x || '').trim()).filter(Boolean);
      } else {
        next = JSON.parse(localStorage.getItem('bannerList') || '[]');
      }
    } catch {
      next = [];
    }
    next = (next || []).map((x) => String(x || '').trim()).filter(Boolean);
    const same =
      next.length === this.bannerItems.length &&
      next.every((v, i) => v === this.bannerItems[i]);
    if (same && !forceRestart) return;
    this.bannerItems = next;
    this.bannerIndex = 0;
    this.bannerPrevSrc = '';
    this.bannerAnimating = false;
    if (!this.bannerItems.length) {
      this.bannerSrc = '';
      this.stopBannerTimer();
      return;
    }
    this.bannerSrc = this.resolveBannerSrc(this.bannerItems[0]);
    this.scheduleBannerAdvance();
  }

  private resolveBannerSrc(raw: string): string {
    if (!raw) return '';
    if (
      raw.startsWith('data:') ||
      raw.startsWith('blob:') ||
      raw.startsWith('assets/') ||
      /^https?:\/\//i.test(raw)
    ) {
      return raw;
    }
    // Prefer photo endpoint for image banners; fall back to file download for hashes.
    try {
      return downloadPhotoUrl(raw, 1920, 1080) || downloadFileUrl(raw);
    } catch {
      return downloadFileUrl(raw);
    }
  }

  private scheduleBannerAdvance(): void {
    this.stopBannerTimer();
    if (this.bannerItems.length <= 1) return;
    this.bannerTimer = setTimeout(() => this.advanceBanner(), BANNER_HOLD_MS);
  }

  private advanceBanner(): void {
    if (!this.bannerItems.length || this.bannerAnimating) return;
    const nextIndex = (this.bannerIndex + 1) % this.bannerItems.length;
    const nextSrc = this.resolveBannerSrc(this.bannerItems[nextIndex]);
    if (!nextSrc || nextSrc === this.bannerSrc) {
      this.bannerIndex = nextIndex;
      this.scheduleBannerAdvance();
      return;
    }

    this.bannerAnimating = true;
    this.bannerPrevSrc = this.bannerSrc;
    this.bannerSrc = nextSrc;
    this.bannerIndex = nextIndex;

    this.bannerTimer = setTimeout(() => {
      this.bannerPrevSrc = '';
      this.bannerAnimating = false;
      this.scheduleBannerAdvance();
    }, BANNER_ANIM_MS);
  }

  private stopBannerTimer(): void {
    if (this.bannerTimer) {
      clearTimeout(this.bannerTimer);
      this.bannerTimer = null;
    }
  }

  private pauseElement(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch {}
  }

  private attachListeners(video: HTMLVideoElement): void {
    this.detachListeners();
    const exitFs = () => {
      try {
        (video as any).webkitExitFullscreen?.();
        document.exitFullscreen?.();
      } catch {}
    };
    this.boundExitFs = () => {
      exitFs();
    };
    this.boundFullscreenChange = () => {
      if (document.fullscreenElement === video) exitFs();
    };
    video.addEventListener('webkitbeginfullscreen', this.boundExitFs as any);
    document.addEventListener('fullscreenchange', this.boundFullscreenChange);
  }

  private detachListeners(): void {
    const video = this.videoPlayer?.nativeElement;
    if (video && this.boundExitFs) {
      video.removeEventListener('webkitbeginfullscreen', this.boundExitFs as any);
    }
    if (this.boundFullscreenChange) {
      document.removeEventListener('fullscreenchange', this.boundFullscreenChange);
    }
    this.boundExitFs = null;
    this.boundFullscreenChange = null;
  }
}
