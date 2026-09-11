import { Injectable } from '@angular/core';
import * as cryptojs from 'crypto-js';
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
  byImage: Record<string, IProductShowcase> = {};
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
    const s = this.getBySale(sl) || this.get(Number(sl?.stock?.id));
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
        if (s?.image) this.byImage[s.image] = s;
      }
    } catch {
      this.map = {};
    }
  }

  async sync(): Promise<void> {
    await this.hydrate();
    await this.bindLocalMedia();
  }

  videoSrc(hash: string): string {
    if (!hash) return '';
    return this.videoPlay[hash] || downloadFileUrl(hash);
  }

  getBySale(sl: any): IProductShowcase | null {
    const img = String(sl?.stock?.image || '').trim();
    if (img && this.byImage[img]) return this.byImage[img];
    return null;
  }

  /**
   * Local first. Network only if hashP changed.
   * 1. Ionic Storage
   * 2. POST productShowcaseHashByImage { image } → { hashP }
   * 3. same hashP → bind local, no ByImage, no filemanager
   * 4. miss / different → ByImage + cacheMedia
   */
  async ensure(sl: any): Promise<IProductShowcase | null> {
    const image = String(sl?.stock?.image || '').trim();
    if (!image) return null;
    await this.hydrate();
    const local = this.byImage[image] || null;

    let remoteHash = '';
    try {
      const hx: any = await this.post('productShowcaseHashByImage', { image });
      remoteHash = String((hx?.data || [])[0]?.hashP || '');
    } catch {
      await this.bindLocalMedia();
      return local;
    }

    if (local && remoteHash && local.hashP === remoteHash) {
      await this.bindLocalMedia();
      return local;
    }
    if (!remoteHash) {
      await this.bindLocalMedia();
      return local;
    }

    try {
      const rx: any = await this.post('productShowcaseByImage', { image });
      const row: IProductShowcase = (rx?.data || [])[0];
      if (row) {
        row.image = image;
        this.byImage[image] = row;
        await this.cacheMedia(row);
        await this.persist();
      }
    } catch (e) {
      console.warn('showcase pull', e);
    }
    await this.bindLocalMedia();
    return this.byImage[image] || local;
  }

  private async persist(): Promise<void> {
    await this.storage.set(STORE, { v: Object.values(this.byImage).length ? Object.values(this.byImage) : Object.values(this.map), d: new Date() }, 'stock');
  }

  private async post(cmd: string, data: any) {
    const mid = this.api.machineId as any;
    const machineId = String(mid?.machineId || mid || localStorage.getItem('machineId') || '');
    const otp = String(localStorage.getItem('otp') || mid?.otp || '');
    const token = cryptojs.SHA256(machineId + otp).toString(cryptojs.enc.Hex);
    const body = {
      token,
      machineId,
      otp,
      data,
      stockIds: data?.stockIds,
    };
    const rx = await this.api.post(cmd, body);
    const res = rx?.data;
    if (res?.status !== 1) {
      console.warn('showcase', cmd, res?.message || res);
    }
    return res;
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
    for (const s of Object.values(this.byImage).length ? Object.values(this.byImage) : Object.values(this.map)) {
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