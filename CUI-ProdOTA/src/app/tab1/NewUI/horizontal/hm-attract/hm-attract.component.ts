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

  featured: any = null;
  featuredSrc = '';
  phase: 'photo' | 'detail' = 'photo';
  storyHtml: SafeHtml | null = null;
  videoSrc = '';
  extraPhotos: string[] = [];
  showcaseTitle = '';
  showcasePrice = 0;
  running = false;

  private holdTimer: any = null;
  private seq = 0;

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
  }

  play(): void {
    this.stop();
    this.start();
  }

  stop(): void {
    this.running = false;
    this.seq++;
    clearTimeout(this.holdTimer);
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
    const main = sl?.stock?.image;
    this.extraPhotos = (sc.photos || []).filter((h: string) => h && h !== main);
    if (!this.extraPhotos.length && (sc.photos || []).length) {
      this.extraPhotos = sc.photos.filter(Boolean);
    }
    this.videoSrc = sc.video ? this.videoSrcOf?.(sc.video) || '' : '';
    return true;
  }

  /** info tap (immediate=true) → detail now. auto loop → photo, then detail. */
  private async showOne(sl: any, token: number, immediate: boolean): Promise<void> {
    this.phase = 'photo';
    this.videoSrc = '';
    this.storyHtml = null;
    this.extraPhotos = [];
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
