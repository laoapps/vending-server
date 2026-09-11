import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppcachingserviceService } from './appcachingservice.service';

@Injectable({
  providedIn: 'root',
})
export class CachingService {
  constructor(private caching: AppcachingserviceService) {}

  async getPhoto(k: string) {
    return await this.caching.get(k);
  }

  async clearStorage() {
    return await this.caching.clear();
  }

  /** Cache-first. Reuse any data: blob. Fetch filemanager only on miss / older date. */
  async saveCachingPhoto(k: string, d: Date, id: string) {
    const x = await this.getPhoto(k + id);
    if (x) {
      try {
        const y = typeof x === 'string' ? JSON.parse(x) : x;
        const v = y?.v || y;
        if (typeof v === 'string' && v.startsWith('data:')) {
          const cachedT = new Date(y.d || 0).getTime();
          const newT = d ? new Date(d).getTime() : 0;
          if (!newT || cachedT >= newT) return x;
        }
      } catch {}
    }
    const w = await this.getBase64ImageFromUrl(k);
    return this.caching.setWithdate(k + id, w, d || new Date(0));
  }

  async saveCachingPhoto2(k: string, v: any) {
    const w = await this.getBase64ImageFromUrl(k);
    return this.caching.set(k, w);
  }

  /** k must be the full filemanager URL. Do not fetch environment.url. */
  async getBase64ImageFromUrl(imageUrl: string) {
    const url = imageUrl?.startsWith('http') || imageUrl?.startsWith('data:')
      ? imageUrl
      : ((localStorage.getItem('filemanagerurl') || (environment as any).filemanagerurl || '').replace(/\/?$/, '/') +
          (imageUrl.includes('/') ? imageUrl.replace(/^\//, '') : 'download/' + imageUrl));

    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}