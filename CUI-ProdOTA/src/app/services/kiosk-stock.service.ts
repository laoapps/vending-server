
/**
 * Drop into: src/app/tab1/Vending/hm-vending-kiosk/kiosk-stock.service.ts
 * Do not copy LoadStockListProcess — that POSTs downloadphoto on every miss
 * and uses filemanagerURL + 'downloadphoto' (the /file/ URL in Network).
 *
 * Uses existing:
 *   apiService.loadVendingSale()
 *   apiService.recoverSale()
 *   storage saleStock
 *   CachingService.saveCachingPhoto / getPhoto
 */
import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IVendingMachineSale } from 'src/app/services/syste.model';
import { IonicStorageService } from 'src/app/ionic-storage.service';
import { CachingService } from 'src/app/services/caching.service';
import { downloadPhotoUrl } from 'src/app/filemanager-url';

@Injectable({ providedIn: 'root' })
export class KioskStockService {
  constructor(
    private api: ApiService,
    private storage: IonicStorageService,
    private photos: CachingService,
  ) {}

  async loadLocal(): Promise<IVendingMachineSale[]> {
    try {
      const s = await this.storage.get('saleStock', 'stock');
      const v = s?.v ?? s;
      return Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : [];
    } catch {
      return [];
    }
  }

  /** POST /machineSaleList — same as Tab1 LoadProductList */
  async fetchServer(): Promise<IVendingMachineSale[]> {
    const rx = await this.api.loadVendingSale();
    const r: any = rx?.data;
    if (r?.status != 1 || !Array.isArray(r.data)) return [];
    return r.data as IVendingMachineSale[];
  }

 /**
   * local extras stay
   * missing on local → add from server ONLY if that slot has qtty > 0
   * name/price/image/updatedAt changed → replace those fields, KEEP local qtty
   */
  merge(local: IVendingMachineSale[], server: IVendingMachineSale[]): IVendingMachineSale[] {
    const map = new Map(local.map((x) => [Number(x.position), x]));
    for (const s of server) {
      const key = Number(s.position);
      const L = map.get(key);
      if (!L) {
        if (Number(s.stock?.qtty) > 0) map.set(key, JSON.parse(JSON.stringify(s)));
        continue;
      }
      if (this.metaChanged(L, s)) {
        const qtty = L.stock?.qtty;
        const next = JSON.parse(JSON.stringify(s));
        if (next.stock) next.stock.qtty = qtty;
        map.set(key, next);
      }
    }
    return [...map.values()].sort((a, b) => Number(a.position) - Number(b.position));
  }

  async persist(list: IVendingMachineSale[]): Promise<void> {
    const hasQty = list.some((x) => Number(x.stock?.qtty) > 0);
    if (!hasQty) {
      console.warn('kiosk persist skipped — all qtty 0, would wipe shelf');
      return;
    }
    await this.storage.set('saleStock', { v: list, d: new Date() }, 'stock');
    if (ApiService.vendingOnSale) {
      ApiService.vendingOnSale.length = 0;
      ApiService.vendingOnSale.push(...list);
    }
    try {
      this.api.newProductItems(list);
    } catch {}
  }

  /** Paint local first. Server only patches name/price/image. Never overwrite qty with 0. */
  async refresh(): Promise<IVendingMachineSale[]> {
    let local = await this.loadLocal();

    let server: IVendingMachineSale[] = [];
    try {
      server = await this.fetchServer();
      if (server.length) {
        try {
          this.api.newProductItems(server);
        } catch {}
      }
    } catch (e) {
      console.warn('kiosk stock server skip', e);
    }

    if (local.length) {
      local = this.merge(local, server);
      await this.persist(local);
      await this.hydratePhotos(local);
      return local;
    }

    // Tab1: local empty → recoverSale, not machineSaleList qtty 0
    try {
      const rx = await this.api.recoverSale();
      const r: any = rx?.data;
      if (r?.status && Array.isArray(r.data) && r.data.length) {
        local = r.data;
      }
    } catch {}

    if (!local.length && server.some((x) => Number(x.stock?.qtty) > 0)) {
      local = server.filter((x) => Number(x.stock?.qtty) > 0);
    }

    if (local.length) await this.persist(local);
    await this.hydratePhotos(local);
    return local;
  }

  /** Paint local first. Server only patches name/price/image. Never overwrite qty with 0. */
  

  private metaChanged(a: IVendingMachineSale, b: IVendingMachineSale): boolean {
    return (
      String(a.updatedAt) !== String(b.updatedAt) ||
      a.stock?.name !== b.stock?.name ||
      a.stock?.price !== b.stock?.price ||
      a.stock?.image !== b.stock?.image
    );
  }



  /** Storage first. Fetch only hashes that are not data:image. */
  async hydratePhotos(list: IVendingMachineSale[]): Promise<void> {
    if (!this.api.imageList) this.api.imageList = {};
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;

    for (const sl of list || []) {
      const id = sl?.stock?.image;
      if (!id) continue;
      if (String(this.api.imageList[id] || '').startsWith('data:image')) continue;

      try {
        const stored = await this.photos.getPhoto(downloadPhotoUrl(id, 256, 256) + id);
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
        const v = parsed?.v || parsed;
        if (typeof v === 'string' && v.startsWith('data:image')) {
          this.api.imageList[id] = v;
          continue;
        }
      } catch {}

      if (!online) continue;
      try {
        const raw = await this.photos.saveCachingPhoto(
          downloadPhotoUrl(id, 256, 256),
          new Date(sl?.stock?.updatedAt || Date.now()),
          id,
        );
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const v = parsed?.v || parsed;
        if (typeof v === 'string' && v.startsWith('data:image')) {
          this.api.imageList[id] = v;
        }
      } catch {}
    }
  }
}