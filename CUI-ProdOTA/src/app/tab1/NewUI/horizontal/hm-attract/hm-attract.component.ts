import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-hm-attract',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './hm-attract.component.html',
  styleUrls: ['./hm-attract.component.scss'],
})
export class HmAttractComponent implements OnInit, OnDestroy {
  @Input() itemHoldMs = 10000;
  @Input() shelfId = 'shelf';
  @Input() products: any[] = [];
  @Input() photoOf: (sl: any, size?: number) => string = () => '';
  @Input() fallback = 'assets/icon/logo.png';
  @Input() hydrateHi?: (sl: any) => Promise<void>;
  @Input() showcaseOf?: (sl: any) => any;
  @Input() videoSrcOf?: (hash: string) => string;
  @Input() auto = true;
  @Input() startAt: any = null;

  @ViewChild('vdo') vdo?: ElementRef<HTMLVideoElement>;

  featured: any = null;
  featuredSrc = '';
  phase: 'photo' | 'detail' = 'photo';
  storyHtml: SafeHtml | null = null;
  videoSrc = '';
  extraPhotos: string[] = [];
  gallery: string[] = [];
  galleryOpen = false;
  galleryIndex = 0;
  showcaseTitle = '';
  showcasePrice = 0;
  running = false;

  private holdTimer: any = null;
  private seq = 0;
  private swipeX = 0;
  private videoPoll: any = null;
  private videoHash = '';

  constructor(
    private ref: ChangeDetectorRef,
    private modalCtrl: ModalController,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.play();
  }

  ngOnDestroy(): void {
    this.stop();
    this.stopVideoWait();
  }

  play(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    this.running = false;
    this.seq++;
    clearTimeout(this.holdTimer);
    this.stopVideoWait();
  }

  async dismiss(): Promise<void> {
    this.stop();
    try {
      await this.modalCtrl.dismiss();
    } catch {}
  }

  onPanelClick(): void {
    if (this.auto) this.dismiss();
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
      await this.showOne(list[0], token, true);
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
      await this.showOne(sl, token, false);
    }
  }

  private applyPhoto(sl: any): void {
    this.featured = sl;
    this.featuredSrc = this.srcOf(sl);
    this.showcaseTitle = sl?.stock?.name || '';
    this.showcasePrice = Number(sl?.stock?.price) || 0;
    this.scrollTo(sl);
    this.hydrateHi?.(sl)?.then(() => {
      if (this.featured === sl && this.running) {
        this.featuredSrc = this.srcOf(sl);
        this.ref.detectChanges();
      }
    });
  }

  private applyDetail(sl: any, sc: any): boolean {
    const real = !!(sc && (sc.html || sc.video || (sc.photos || []).length));
    if (!real) return false;
    this.phase = 'detail';
    this.showcaseTitle = sc.title || sl?.stock?.name || '';
    this.showcasePrice = Number(sc.price) || Number(sl?.stock?.price) || 0;
    this.storyHtml = sc.html
      ? this.sanitizer.bypassSecurityTrustHtml(sc.html)
      : null;
    const main = String(sl?.stock?.image || '');
    const shots = (sc.photos || []).filter(Boolean);
    this.extraPhotos = shots.filter((h: string) => h !== main);
    this.gallery = [main, ...this.extraPhotos].filter(Boolean);
    this.videoHash = sc.video || '';
    this.videoSrc = sc.video ? this.videoSrcOf?.(sc.video) || '' : '';
    if (this.videoHash && !this.videoSrc) this.waitForVideo(this.videoHash);
    else if (this.videoSrc) setTimeout(() => this.playVid(), 50);
    return true;
  }

  private waitForVideo(hash: string): void {
    this.stopVideoWait();
    let n = 0;
    this.videoPoll = setInterval(() => {
      const u = this.videoSrcOf?.(hash) || '';
      if (u) {
        this.videoSrc = u;
        this.ref.detectChanges();
        this.stopVideoWait();
        setTimeout(() => this.playVid(), 30);
        return;
      }
      if (++n > 80) this.stopVideoWait();
    }, 200);
  }

  playVid(): void {
    const el = this.vdo?.nativeElement;
    if (!el || !this.videoSrc) return;
    el.muted = true;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  }

  private stopVideoWait(): void {
    clearInterval(this.videoPoll);
    this.videoPoll = null;
  }

  /** info tap (immediate=true) → detail now. auto loop → photo, then detail. */
  private async showOne(sl: any, token: number, immediate: boolean): Promise<void> {
    this.phase = 'photo';
    this.videoSrc = '';
    this.storyHtml = null;
    this.extraPhotos = [];
    this.gallery = [];
    this.galleryOpen = false;
    this.applyPhoto(sl);
    this.ref.detectChanges();

    const sc = this.showcaseOf?.(sl);

    if (immediate) {
      this.applyDetail(sl, sc);
      this.ref.detectChanges();
      await this.sleep(86400000, token);
      return;
    }

    const hold = Number(sc?.holdMs) > 0 ? Number(sc.holdMs) : this.itemHoldMs;
    await this.sleep(hold, token);
    if (!this.running || token !== this.seq) return;
    if (!this.applyDetail(sl, sc)) return;
    this.ref.detectChanges();
    const vms = Number(sc?.videoMs) > 0 ? Number(sc.videoMs) : 12000;
    await this.sleep(vms, token);
  }

  shotSrc(hash: string): string {
    const a = this.photoOf?.({ stock: { image: hash } }, 1024) || '';
    if (a.startsWith('data:') || a.startsWith('blob:') || a.startsWith('http')) return a;
    return this.fallback;
  }

  openGallery(i: number): void {
    if (!this.gallery.length) return;
    this.galleryIndex = Math.max(0, Math.min(i, this.gallery.length - 1));
    this.galleryOpen = true;
  }

  closeGallery(): void {
    this.galleryOpen = false;
  }

  prevShot(): void {
    if (!this.gallery.length) return;
    this.galleryIndex = (this.galleryIndex - 1 + this.gallery.length) % this.gallery.length;
  }

  nextShot(): void {
    if (!this.gallery.length) return;
    this.galleryIndex = (this.galleryIndex + 1) % this.gallery.length;
  }

  onSwipeStart(ev: TouchEvent): void {
    this.swipeX = ev.changedTouches?.[0]?.clientX || 0;
  }

  onSwipeEnd(ev: TouchEvent): void {
    const x = ev.changedTouches?.[0]?.clientX || 0;
    const d = x - this.swipeX;
    if (d > 40) this.prevShot();
    else if (d < -40) this.nextShot();
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