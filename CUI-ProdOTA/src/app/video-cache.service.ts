import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { environment } from 'src/environments/environment';

const CACHE_NAME = 'hm-ads-v1';

@Injectable({
  providedIn: 'root',
})
export class VideoCacheService {
  public downloadProgress = 0;
  private blobUrls = new Map<string, string>();

  constructor(private ngZone: NgZone) {
    try {
      Filesystem.addListener('progress', (status) => {
        this.ngZone.run(() => {
          this.downloadProgress = Math.round((status.bytes / status.contentLength) * 100);
        });
      });
    } catch {}
  }

  private filemanagerBase(): string {
    const raw = (
      localStorage.getItem('filemanagerurl') ||
      (environment as any).filemanagerurl ||
      'https://filemanager-api.laoapps.com/api/v1/'
    ).trim();
    let b = raw.replace(/\/+$/, '');
    b = b.replace(/\/file\/download$/i, '');
    b = b.replace(/\/downloadphoto$/i, '');
    if (!/\/api\/v1$/i.test(b) && !b.includes('/api/')) b = b + '/api/v1';
    return b + '/';
  }

  private resolveMediaHash(raw: string): string {
    if (!raw) return '';
    let s = String(raw).trim();
    if (s.startsWith('data:') || s.startsWith('blob:')) return s;
    if (/^https?:\/\//i.test(s)) {
      if (s.includes('/DATA/')) return s.split('/DATA/').pop() || s;
      const q = s.match(/[?&]url=([^&]+)/);
      if (q) return decodeURIComponent(q[1]);
      const dl = s.match(/\/file\/download\/([^/?#]+)/);
      if (dl) return dl[1];
      return s;
    }
    s = s.replace(/^\/+/, '').replace(/^DATA\//i, '').replace(/^file\/download\//i, '');
    return s.split('/').pop() || s;
  }

  remoteUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (/^https?:\/\//i.test(url) && !url.includes('/DATA/') && !url.includes('localhost')) {
      return url;
    }
    return `${this.filemanagerBase()}file/download/${this.resolveMediaHash(url)}`;
  }

  private getFileName(url: string): string {
    const hash = this.resolveMediaHash(url).replace(/[^a-zA-Z0-9._-]/g, '') || 'ad';
    return hash.indexOf('.') === -1 ? hash + '.mp4' : hash;
  }

  /** Download every ad while online. Call from kiosk ngOnInit. */
  async preloadAll(urls: string[]): Promise<void> {
    for (const url of urls || []) {
      try {
        await this.downloadIfNotExist(url);
      } catch (e) {
        console.warn('ad preload skip', url, e);
      }
    }
  }

  async getLocalPath(url: string): Promise<string | null> {
    if (Capacitor.getPlatform() === 'web') {
      return this.webCachedBlob(url);
    }
    try {
      const stat = await Filesystem.stat({
        path: this.getFileName(url),
        directory: Directory.Data,
      });
      return stat.uri;
    } catch {
      return null;
    }
  }

  /** Cache-first. Never return a live HTTP URL if a local copy exists. */
  async downloadIfNotExist(url: string): Promise<string> {
    const local = await this.getLocalPath(url);
    if (local) return local;

    const remote = this.remoteUrl(url);
    if (Capacitor.getPlatform() === 'web') {
      return this.webDownload(remote);
    }

    try {
      await Filesystem.downloadFile({
        url: remote,
        path: this.getFileName(url),
        directory: Directory.Data,
        progress: true,
      });
      const stat = await Filesystem.stat({
        path: this.getFileName(url),
        directory: Directory.Data,
      });
      return stat.uri;
    } catch (error) {
      console.error('Native download failed', error);
      const again = await this.getLocalPath(url);
      if (again) return again;
      throw error;
    }
  }

  getPlayableUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:')) return path;
    if (path.startsWith('http') && Capacitor.getPlatform() === 'web') return path;
    try {
      return Capacitor.convertFileSrc(path);
    } catch {
      return path;
    }
  }

  private async webCachedBlob(url: string): Promise<string | null> {
    const remote = this.remoteUrl(url);
    if (this.blobUrls.has(remote)) return this.blobUrls.get(remote)||'';
    try {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(remote);
      if (!hit) return null;
      const blob = await hit.blob();
      const obj = URL.createObjectURL(blob);
      this.blobUrls.set(remote, obj);
      return obj;
    } catch {
      return null;
    }
  }

  private async webDownload(remote: string): Promise<string> {
    const cache = await caches.open(CACHE_NAME);
    try {
      const res = await fetch(remote);
      if (!res.ok) throw new Error('fetch ' + res.status);
      await cache.put(remote, res.clone());
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      this.blobUrls.set(remote, obj);
      return obj;
    } catch (e) {
      const cached = await this.webCachedBlob(remote);
      if (cached) return cached;
      throw e;
    }
  }

  async deleteVideo(url: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(this.remoteUrl(url));
      } catch {}
      return;
    }
    try {
      await Filesystem.deleteFile({
        path: this.getFileName(url),
        directory: Directory.Data,
      });
    } catch {}
  }
}