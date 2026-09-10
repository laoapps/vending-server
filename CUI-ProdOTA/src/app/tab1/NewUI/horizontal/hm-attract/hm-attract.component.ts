import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';
import { VideoCacheService } from 'src/app/video-cache.service';
import { downloadFileUrl } from 'src/app/filemanager-url';

@Component({
  selector: 'app-hm-attract',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './hm-attract.component.html',
  styleUrls: ['./hm-attract.component.scss'],
})
export class HmAttractComponent implements OnInit, OnDestroy {
  /** photo hold — default 10s, overridable per product */
  @Input() itemHoldMs = environment.holdMs || 10000;
  @Input() shelfId = 'shelf';
  @Input() products: any[] = [];
  @Input() photoOf: (sl: any, size?: number) => string = () => '';
  @Input() fallback = 'assets/icon/logo.png';
  @Input() hydrateHi?: (sl: any) => Promise<void>;
  @Input() showcaseOf?: (sl: any) => any;
  /** @deprecated prefer internal VideoCacheService.resolvePlayable */
  @Input() videoSrcOf?: (hash: string) => string;
  @Input() auto = true;
  @Input() startAt: any = null;

  featured: any = null;
  featuredSrc = '';
  phase: 'photo' | 'detail' = 'photo';
  storyHtml: SafeHtml | null = null;
  videoSrc = '';
  extraPhotos: string[] = [];
  running = false;

  private holdTimer: any = null;
  private seq = 0;
  private activeVideoPlayable = '';

  constructor(
    private ref: ChangeDetectorRef,
    private modalCtrl: ModalController,
    private sanitizer: DomSanitizer,
    private videos: VideoCacheService,
  ) {}

  ngOnInit(): void {
    this.play();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  play(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    this.running = false;
    this.seq++;
    clearTimeout(this.holdTimer);
    this.releaseVideo();
  }

  async dismiss(): Promise<void> {
    this.stop();
    try {
      await this.modalCtrl.dismiss();
    } catch {}
  }

  private async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const token = ++this.seq;
    const list = this.startAt ? [this.startAt] : [...(this.products || [])];
    if (!list.length) {
      this.running = false;
      return;
    }
    if (!this.auto) {
      await this.showOne(list[0], token);
      return;
    }
    const forward = [...(this.products || [])];
    const backward = [...forward].reverse();
    while (this.running && token === this.seq) {
      await this.playPass(forward, token);
      if (!this.running || token !== this.seq) return;
      await this.playPass(backward, token);
    }
  }

  private srcOf(sl: any): string {
    const a = this.photoOf?.(sl, 1024) || '';
    if (a.startsWith('data:image') || a.startsWith('blob:')) return a;
    if (a.startsWith('data:application/octet-stream')) {
      return 'data:image/jpeg;base64,' + a.split(',')[1];
    }
    return this.fallback;
  }

  private async playPass(list: any[], token: number): Promise<void> {
    for (const sl of list) {
      if (!this.running || token !== this.seq) return;
      await this.showOne(sl, token);
    }
  }

  private async showOne(sl: any, token: number): Promise<void> {
    this.featured = sl;
    this.phase = 'photo';
    this.releaseVideo();
    this.storyHtml = null;
    this.extraPhotos = [];
    this.featuredSrc = this.srcOf(sl);
    this.ref.detectChanges();
    this.scrollTo(sl);
    this.hydrateHi?.(sl)?.then(() => {
      if (this.featured === sl && this.running) {
        this.featuredSrc = this.srcOf(sl);
        this.ref.detectChanges();
      }
    });

    const sc = this.showcaseOf?.(sl);
    const hold = Number(sc?.holdMs) > 0 ? Number(sc.holdMs) : this.itemHoldMs;
    await this.sleep(hold, token);
    if (!this.running || token !== this.seq) return;

    if (sc && (sc.video || sc.html || sc.story || (sc.photos || []).length)) {
      this.phase = 'detail';
      this.storyHtml = this.sanitizer.bypassSecurityTrustHtml(
        sc.html || (sc.story ? `<p>${sc.story}</p>` : ''),
      );
      this.extraPhotos = sc.photos || [];
      if (sc.video) {
        await this.loadShowcaseVideo(sc.video, token);
      }
      this.ref.detectChanges();
      const vms = Number(sc.videoMs) > 0 ? Number(sc.videoMs) : 12000;
      await this.sleep(vms, token);
    }
  }

  private async loadShowcaseVideo(hash: string, token: number): Promise<void> {
    try {
      const playable = await this.videos.resolvePlayable(downloadFileUrl(hash));
      if (!this.running || token !== this.seq) {
        this.videos.releasePlayable(playable);
        return;
      }
      if (this.activeVideoPlayable && this.activeVideoPlayable !== playable) {
        this.videos.releasePlayable(this.activeVideoPlayable);
      }
      this.activeVideoPlayable = playable;
      this.videoSrc = playable;
    } catch {
      // Optional legacy sync fallback only if already a local/blob URL.
      const legacy = this.videoSrcOf?.(hash) || '';
      this.videoSrc = legacy.startsWith('blob:') || legacy.startsWith('data:') ? legacy : '';
    }
  }

  private releaseVideo(): void {
    if (this.activeVideoPlayable) {
      this.videos.releasePlayable(this.activeVideoPlayable);
      this.activeVideoPlayable = '';
    }
    this.videoSrc = '';
  }

  private scrollTo(sl: any): void {
    const shelf = document.getElementById(this.shelfId);
    if (!shelf) return;
    const card = shelf.querySelector(
      `.product-card[data-position="${sl?.position}"]`,
    ) as HTMLElement | null;
    if (!card) return;
    const top = card.offsetTop - Math.max(12, (shelf.clientHeight - card.offsetHeight) / 3);
    shelf.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  private sleep(ms: number, token: number): Promise<void> {
    return new Promise((resolve) => {
      this.holdTimer = setTimeout(() => {
        if (token === this.seq) resolve();
      }, ms);
    });
  }
}
