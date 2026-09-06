import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-hm-attract',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './hm-attract.component.html',
  styleUrls: ['./hm-attract.component.scss'],
})
export class HmAttractComponent implements OnInit, OnDestroy {
  @Input() itemHoldMs = 2500;
  @Input() shelfId = 'shelf';
  @Input() products: any[] = [];
  @Input() photoOf: (sl: any, size?: number) => string = () => '';
  @Input() fallback = 'assets/icon/logo.png';
  @Input() hydrateHi?: (sl: any) => Promise<void>;
  featured: any = null;
  featuredSrc = '';
  running = false;

  private holdTimer: any = null;
  private seq = 0;

  constructor(
    private ref: ChangeDetectorRef,
    private modalCtrl: ModalController,
  ) { }

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
    } catch { }
  }

  private async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const token = ++this.seq;
    const list = [...(this.products || [])];
    if (!list.length) {
      this.running = false;
      return;
    }
    const forward = list;
    const backward = [...list].reverse();
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
      this.featured = sl;
      this.featuredSrc = this.srcOf(sl);          // 256 now
      this.ref.detectChanges();
      this.scrollTo(sl);
      this.hydrateHi?.(sl)?.then(() => {          // 1024 in background
        if (this.featured === sl && this.running) {
          this.featuredSrc = this.srcOf(sl);
          this.ref.detectChanges();
        }
      });
      await this.sleep(this.itemHoldMs, token);
    }
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