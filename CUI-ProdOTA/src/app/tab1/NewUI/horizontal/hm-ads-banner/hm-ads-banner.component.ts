import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCacheService } from 'src/app/video-cache.service';
import { ApiService } from 'src/app/services/api.service';
import { downloadFileUrl, downloadPhotoUrl } from 'src/app/filemanager-url';

const BANNER_HOLD_MS = 6500;
const BANNER_ANIM_MS = 280;

@Component({
  selector: 'app-hm-ads-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hm-ads-banner.component.html',
  styleUrls: ['./hm-ads-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmAdsBannerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() allowAdSound = true;
  /** Admin musicVolume is 0–100. video.volume is 0–1. */
  @Input() musicVolume = 6;
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
  /** Local file src already on disk, so slide changes do not touch the filesystem. */
  private bannerReady = new Map<string, string>();
  private warmed = false;

  constructor(
    private videoService: VideoCacheService,
    private api: ApiService,
    private zone: NgZone,
    private ref: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    try {
      this.playlist = JSON.parse(localStorage.getItem('adsList') || '[]');
    } catch {
      this.playlist = [];
    }
    if (this.playlist.length) {
      void this.playVideo(0);
    } else {
      void this.reloadBanners(true);
    }
    this.listPoll = setInterval(() => void this.reloadBanners(false), 8000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allowAdSound'] || changes['musicVolume']) this.applyAdSound();
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

    let playable = '';
    try {
      playable = await this.zone.runOutsideAngular(() => this.videoService.resolvePlayable(url));
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
    this.attachAndPlay(playable, token);
  }

  /** Download the rest only after the current clip is already playing. */
  private async warmMedia(): Promise<void> {
    await this.zone.runOutsideAngular(async () => {
      await this.videoService.preloadAll(this.playlist);
    });
    await this.reloadBanners(true);
  }

  private applyAdSound(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) return;
    const level = Math.max(0, Math.min(100, Number(this.musicVolume) || 0)) / 100;
    video.muted = !this.allowAdSound;
    video.volume = this.allowAdSound ? level : 0;
  }

  private attachAndPlay(playable: string, token: number): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video || token !== this.playToken) return;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    this.applyAdSound();
    video.controls = false;
    (video as any).disablePictureInPicture = true;
    this.attachListeners(video);
    const same = video.getAttribute('data-src') === playable;
    if (same) {
      try {
        video.currentTime = 0;
      } catch {}
      video.play().catch(() => {});
      return;
    }
    video.setAttribute('data-src', playable);
    video.src = playable;
    const start = () => {
      if (token !== this.playToken) return;
      video.play().catch(() => {});
    };
    if (video.readyState >= 2) start();
    else video.addEventListener('canplay', start, { once: true });
    if (!this.warmed) {
      const warm = () => {
        if (this.warmed || token !== this.playToken) return;
        this.warmed = true;
        void this.warmMedia();
      };
      if (!video.paused && video.readyState >= 2) warm();
      else video.addEventListener('playing', warm, { once: true });
    }
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

  private async reloadBanners(forceRestart: boolean): Promise<void> {
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
    await this.zone.runOutsideAngular(() => this.preloadBanners());
    this.bannerSrc = this.bannerReady.get(this.bannerItems[0]) || '';
    this.scheduleBannerAdvance();
    this.ref.markForCheck();
  }

  private async preloadBanners(): Promise<void> {
    const keep = new Set(this.bannerItems);
    for (const key of [...this.bannerReady.keys()]) {
      if (!keep.has(key)) this.bannerReady.delete(key);
    }
    for (const raw of this.bannerItems) {
      if (this.bannerReady.has(raw)) continue;
      try {
        const src = await this.cachedBannerSrc(raw);
        if (src) this.bannerReady.set(raw, src);
      } catch {}
    }
  }

  private async cachedBannerSrc(raw: string): Promise<string> {
    const remote = this.resolveBannerSrc(raw);
    if (!remote) return '';
    if (remote.startsWith('data:') || remote.startsWith('blob:') || remote.startsWith('assets/')) {
      return remote;
    }
    try {
      return await this.videoService.resolveImagePlayable(remote);
    } catch (e) {
      console.warn('banner cache skip, using remote', remote, e);
      return remote;
    }
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
      return downloadPhotoUrl(raw, 1280, 720) || downloadFileUrl(raw);
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
    const nextSrc = this.bannerReady.get(this.bannerItems[nextIndex]) || '';
    if (!nextSrc || nextSrc === this.bannerSrc) {
      this.bannerIndex = nextIndex;
      this.scheduleBannerAdvance();
      this.ref.markForCheck();
      return;
    }

    this.bannerAnimating = true;
    this.bannerPrevSrc = this.bannerSrc;
    this.bannerSrc = nextSrc;
    this.bannerIndex = nextIndex;
    this.ref.markForCheck();

    this.bannerTimer = setTimeout(() => {
      this.bannerPrevSrc = '';
      this.bannerAnimating = false;
      this.scheduleBannerAdvance();
      this.ref.markForCheck();
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
