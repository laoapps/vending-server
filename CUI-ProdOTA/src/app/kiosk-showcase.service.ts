import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { IonicStorageService } from 'src/app/ionic-storage.service';
import { IProductShowcase } from './services/syste.model';
import { CachingService } from 'src/app/services/caching.service';
import { downloadFileUrl, downloadPhotoUrl } from './filemanager-url';
import { VideoCacheService } from './video-cache.service';

const STORE = 'productShowcase';

/**
 * Cache-first showcase.
 * 1. Ionic Storage always
 * 2. POST productShowcaseHashes → { stockId, hashP }
 * 3. hash match → keep local, no pull, no filemanager
 * 4. miss / different hash → POST productShowcasePull { stockIds }
 *    then cache photos @1024 + video, persist
 * Offline → stay on local. No fake rows.
 */
@Injectable({ providedIn: 'root' })
export class KioskShowcaseService {
  map: Record<number, IProductShowcase> = {};
  videoPlay: Record<string, string> = {};

  constructor(
    private api: ApiService,
    private storage: IonicStorageService,
    private photos: CachingService,
    private videos: VideoCacheService,
  ) {}

  get(stockId: number): IProductShowcase | null {
    return this.map[Number(stockId)] || null;
  }

  has(sl: any): boolean {
    const s = this.get(Number(sl?.stock?.id));
    if (!s) return false;
    return !!(s.html || s.video || (s.photos && s.photos.length));
  }

  async hydrate(): Promise<void> {
    try {
      const raw = await this.storage.get(STORE, 'stock');
      const list: IProductShowcase[] = Array.isArray(raw?.v)
        ? raw.v
        : Array.isArray(raw)
          ? raw
          : [];
      this.map = {};
      for (const s of list) {
        if (s?.stockId) this.map[Number(s.stockId)] = s;
      }
    } catch {
      this.map = {};
    }
  }

  async sync(): Promise<void> {
    await this.hydrate();

    let remote: { stockId: number; hashP: string }[] = [];
    try {
      const rx: any = await this.post('productShowcaseHashes', {});
      if (rx?.status !== 1) {
        await this.bindLocalMedia();
        return;
      }
      remote = Array.isArray(rx.data) ? rx.data : [];
    } catch {
      await this.bindLocalMedia();
      return;
    }

    const remoteIds = new Set(remote.map((r) => Number(r.stockId)));
    let dirty = false;
    for (const id of Object.keys(this.map)) {
      if (!remoteIds.has(Number(id))) {
        delete this.map[Number(id)];
        dirty = true;
      }
    }

    const miss: number[] = [];
    for (const r of remote) {
      const id = Number(r.stockId);
      if (!id) continue;
      if (this.map[id]?.hashP !== r.hashP) miss.push(id);
    }

    if (miss.length) {
      try {
        const rx: any = await this.post('productShowcasePull', { stockIds: miss });
        const rows: IProductShowcase[] = rx?.data || [];
        for (const s of rows) {
          if (!s?.stockId) continue;
          this.map[Number(s.stockId)] = s;
          await this.cacheMedia(s);
          dirty = true;
        }
      } catch {}
    }

    if (dirty) await this.persist();
    await this.bindLocalMedia();
  }

  videoSrc(hash: string): string {
    if (!hash) return '';
    return this.videoPlay[hash] || '';
  }

  private async persist(): Promise<void> {
    await this.storage.set(STORE, { v: Object.values(this.map), d: new Date() }, 'stock');
  }

  private async post(cmd: string, data: any) {
    const url = String((this.api as any).url || '').replace(/\/?$/, '/') + cmd;
    const mid = (this.api as any).machineId;
    const body = {
      token: localStorage.getItem('token') || localStorage.getItem('lva_token'),
      machineId: mid?.machineId || mid,
      otp: localStorage.getItem('otp'),
      data,
      stockIds: data?.stockIds,
    };
    return firstValueFrom((this.api as any).http.post(url, body));
  }

  private unwrap(raw: any): string {
    try {
      const y = typeof raw === 'string' ? JSON.parse(raw) : raw;
      let v = y?.v || y;
      if (typeof v !== 'string') return '';
      if (v.startsWith('data:application/octet-stream')) {
        v = 'data:image/jpeg;base64,' + v.split(',')[1];
      }
      return v.startsWith('data:') ? v : '';
    } catch {
      return typeof raw === 'string' && raw.startsWith('data:') ? raw : '';
    }
  }

  /** hash match — reuse Ionic Storage / video cache only */
  private async bindLocalMedia(): Promise<void> {
    if (!this.api.imageList) this.api.imageList = {};
    for (const s of Object.values(this.map)) {
      if (s.video && !this.videoPlay[s.video]) {
        try {
          const path = await this.videos.getLocalPath?.(downloadFileUrl(s.video));
          if (path) this.videoPlay[s.video] = this.videos.getPlayableUrl(path);
        } catch {}
      }
      for (const h of s.photos || []) {
        if (this.api.imageList[h + '@1024']?.startsWith?.('data:')) continue;
        if (this.api.imageList[h]?.startsWith?.('data:')) continue;
        try {
          const raw = await this.photos.getPhoto(downloadPhotoUrl(h, 1024, 1024) + h + '@1024');
          const v = this.unwrap(raw);
          if (v) {
            this.api.imageList[h] = v;
            this.api.imageList[h + '@1024'] = v;
          }
        } catch {}
      }
    }
  }

  /** hash miss only — download then cache */
  private async cacheMedia(s: IProductShowcase): Promise<void> {
    if (!this.api.imageList) this.api.imageList = {};
    if (s.video) {
      try {
        const path = await this.videos.downloadIfNotExist(downloadFileUrl(s.video));
        if (path) this.videoPlay[s.video] = this.videos.getPlayableUrl(path);
      } catch {}
    }
    for (const h of s.photos || []) {
      if (!h) continue;
      if (this.api.imageList[h + '@1024']?.startsWith?.('data:')) continue;
      try {
        const raw = await this.photos.saveCachingPhoto(
          downloadPhotoUrl(h, 1024, 1024),
          new Date(s.updatedAt || 0),
          h + '@1024',
        );
        const v = this.unwrap(raw);
        if (v) {
          this.api.imageList[h] = v;
          this.api.imageList[h + '@1024'] = v;
        }
      } catch {}
    }
  }
}