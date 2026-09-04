import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppcachingserviceService } from './appcachingservice.service';
import { downloadPhotoUrl } from '../filemanager-url';

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

  async saveCachingPhoto(k: string, d: Date, id: string) {
    const x = await this.getPhoto(k + id);

    if (x) {
      const y = JSON.parse(x);

      if (new Date(y.d).getTime() != d.getTime()) {
        const w = await this.getBase64ImageFromUrl(k);
        return this.caching.setWithdate(k + id, w, d);
      }

      if (typeof y.v === 'string' && y.v.indexOf('data:application/octet-stream') !== -1) {
        const w = await this.getBase64ImageFromUrl(k);
        return this.caching.setWithdate(k + id, w, d);
      }
      return x;
    }

    const w = await this.getBase64ImageFromUrl(k);
    return this.caching.setWithdate(k + id, w, d);
  }

  async saveCachingPhoto2(k: string, v: any) {
    const w = await this.getBase64ImageFromUrl(k);
    return this.caching.set(k, w);
  }

  async getBase64ImageFromUrl(imageUrl: string) {
    const url =
      imageUrl?.startsWith('http') || imageUrl?.startsWith('data:')
        ? imageUrl
        : downloadPhotoUrl(imageUrl, 256, 256);

    const res = await fetch(url);
    let blob = await res.blob();
    if (!blob.type || blob.type === 'application/octet-stream') {
      blob = new Blob([blob], { type: 'image/jpeg' });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}