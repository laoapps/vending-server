import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IonicStorageService } from 'src/app/ionic-storage.service';
import { IProductShowcase } from 'src/app/services/syste.model';
import { CachingService } from 'src/app/services/caching.service';
import { downloadFileUrl, downloadPhotoUrl } from './filemanager-url';
import { VideoCacheService } from './video-cache.service';

const STORE = 'productShowcase';

@Injectable({ providedIn: 'root' })
export class KioskShowcaseService {
  map: Record<number, IProductShowcase> = {};

  constructor(
    private api: ApiService,
    private storage: IonicStorageService,
    private photos: CachingService,
    private videos: VideoCacheService,
  ) { }

  USE_FAKE = true;

  seedFake(saleList: any[]) {
    if (!this.USE_FAKE) return;
    for (const sl of saleList || []) {
      const id = Number(sl?.stock?.id);
      if (!id) continue;
      this.map[id] = {
        stockId: id,
        title: sl.stock.name,
        price: sl.stock.price,
        holdMs: 10000,
        videoMs: 8000,
        html: `
  <h3>${sl.stock.name}</h3>
  <p>ສິນຄ້າຈິງຈາກເຄື່ອງ · ກົດເພື່ອຊື້ທັນທີ.</p>
  <ul>
    <li>ລາຄາ ${Number(sl.stock.price).toLocaleString()} LAK</li>
    <li>ສະຕ໋ອກ ${sl.stock.qtty}</li>
  </ul>
`,
        photos: sl.stock.image ? [sl.stock.image, sl.stock.image] : [],
        video: '', // later: filemanager hash, vertical 9:16, 10–15s
        story: sl.stock.name,
        hashP: 'fake',
      };
    }
  }

  get(stockId: number): IProductShowcase | null {
    return this.map[stockId] || null;
  }

  async hydrate(): Promise<void> {
    try {
      const raw = await this.storage.get(STORE, 'stock');
      const list: IProductShowcase[] = Array.isArray(raw?.v) ? raw.v : Array.isArray(raw) ? raw : [];
      this.map = {};
      for (const s of list) if (s?.stockId) this.map[Number(s.stockId)] = s;
    } catch {
      this.map = {};
    }
  }

  /** Compare hashes. Pull only stockIds that changed. */
  async sync(): Promise<void> {
    await this.hydrate();
    let remote: { stockId: number; hashP: string }[] = [];
    try {
      const rx: any = await this.api.post('productShowcaseHashes', {});
      remote = rx?.data || [];
    } catch {
      return;
    }
    const miss: number[] = [];
    for (const r of remote) {
      const local = this.map[Number(r.stockId)];
      if (!local || local.hashP !== r.hashP) miss.push(Number(r.stockId));
    }
    if (!miss.length) return;
    try {
      const rx: any = await this.api.post('productShowcasePull', { stockIds: miss });
      const rows: IProductShowcase[] = rx?.data || [];
      for (const s of rows) {
        this.map[Number(s.stockId)] = s;
        await this.cacheMedia(s);
      }
      await this.storage.set(STORE, { v: Object.values(this.map), d: new Date() }, 'stock');
    } catch { }
  }

  private async cacheMedia(s: IProductShowcase): Promise<void> {
    const hashes = [...(s.photos || [])];
    if (s.video) {
      try {
        await this.videos.downloadIfNotExist(downloadFileUrl(s.video));
      } catch { }
    }
    for (const h of hashes) {
      try {
        await this.photos.saveCachingPhoto(
          downloadPhotoUrl(h, 1024, 1024),
          new Date(s.updatedAt || 0),
          h + '@1024',
        );
      } catch { }
    }
  }
}