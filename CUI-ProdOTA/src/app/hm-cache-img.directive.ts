/**
 * One rule for every product <img>:
 *   already a picture → show it
 *   else cache → show it
 *   else file manager → save cache → show it
 *
 * Do NOT write the data URL back onto stock.image. Leave the hash there.
 *
 * Kiosk / dock / attract / StocksalePage — drop [src], use:
 *   <img [hmCacheImg]="sl.stock?.imageurl || sl.stock?.image" [alt]="sl.stock?.name" />
 *
 * Add HmCacheImgDirective to that component's `imports` (standalone)
 * or to the NgModule `imports` (StocksalePage).
 */
import { Directive, ElementRef, Injectable, Input, OnChanges } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AppcachingserviceService } from 'src/app/services/appcachingservice.service';
import { CachingService } from 'src/app/services/caching.service';
import { downloadPhotoUrl, resolveMediaHash } from './filemanager-url';

const LOGO = 'assets/icon/logo.png';

@Directive({
  selector: 'img[hmCacheImg]',
  standalone: true,
})
export class HmCacheImgDirective implements OnChanges {
  @Input() hmCacheImg: string | null = '';
  private seq = 0;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private photos: ProductPhotoService,
  ) {}

  ngOnChanges(): void {
    const raw = String(this.hmCacheImg || '');
    const img = this.el.nativeElement;
    const token = ++this.seq;

    if (isPicture(raw)) {
      img.src = asPicture(raw);
      return;
    }

    const hash = resolveMediaHash(raw);
    if (!hash || hash.startsWith('http') || hash.startsWith('data:')) {
      img.src = LOGO;
      return;
    }

    img.src = LOGO;
    this.photos.resolve(hash).then((src) => {
      if (token !== this.seq) return;
      img.src = src || LOGO;
    });
  }
}

@Injectable({ providedIn: 'root' })
export class ProductPhotoService {
  private inflight = new Map<string, Promise<string>>();
  private cashReady: Promise<void> | null = null;

  constructor(
    private api: ApiService,
    private cache: CachingService,
    private cashing: AppcachingserviceService,
  ) {}

  resolve(hash: string): Promise<string> {
    const hit = this.memory(hash);
    if (hit) return Promise.resolve(hit);
    const pending = this.inflight.get(hash);
    if (pending) return pending;
    const job = this.load(hash).finally(() => this.inflight.delete(hash));
    this.inflight.set(hash, job);
    return job;
  }

  private async load(hash: string): Promise<string> {
    const mem = this.memory(hash);
    if (mem) return mem;

    const key = downloadPhotoUrl(hash, 256, 256) + hash;
    try {
      const stored = pictureOf(await this.cache.getPhoto(key));
      if (stored) return this.keep(hash, stored);
    } catch { /* miss */ }

    await this.readCashLists();
    const fromList = this.memory(hash);
    if (fromList) return fromList;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) return '';

    try {
      const raw = await this.cache.saveCachingPhoto(downloadPhotoUrl(hash, 256, 256), new Date(0), hash);
      const file = pictureOf(raw);
      if (file) return this.keep(hash, file);
    } catch { /* server miss */ }
    return '';
  }

  private memory(hash: string): string {
    const list = (this.api as any).imageList || {};
    return pictureOf(list[hash]);
  }

  private keep(hash: string, file: string): string {
    if (!(this.api as any).imageList) (this.api as any).imageList = {};
    (this.api as any).imageList[hash] = file;
    return file;
  }

  /** Tab1 cash blob, once. Key is ownerUuid, then machineId. */
  private readCashLists(): Promise<void> {
    if (!this.cashReady) this.cashReady = this.readCashListsNow();
    return this.cashReady;
  }

  private async readCashListsNow(): Promise<void> {
    const a = this.api as any;
    const keys = [...new Set(
      [a.ownerUuid, localStorage.getItem('ownerUuid'), localStorage.getItem('machineId'), a.machineId?.machineId]
        .map((x) => (x == null ? '' : String(x)))
        .filter((x) => !!x),
    )];
    for (const key of keys) {
      try {
        const run = await this.cashing.get(key);
        const parse = typeof run === 'string' ? JSON.parse(run) : run;
        const list = parse?.v || parse || [];
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          const name = item?.name;
          const file = pictureOf(item?.file);
          if (name && file) this.keep(name, file);
        }
      } catch { /* next key */ }
    }
  }
}

function isPicture(s: string): boolean {
  return !!s && (s.startsWith('data:image') || s.startsWith('data:application/octet-stream') || s.startsWith('blob:'));
}

function asPicture(s: string): string {
  if (s.startsWith('data:application/octet-stream')) return 'data:image/jpeg;base64,' + s.split(',')[1];
  return s;
}

function pictureOf(raw: any): string {
  if (!raw) return '';
  try {
    const y = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const v = String(y?.v || y || '');
    return isPicture(v) ? asPicture(v) : '';
  } catch {
    const v = String(raw);
    return isPicture(v) ? asPicture(v) : '';
  }
}