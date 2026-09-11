import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FILEMANAGER_WriteFile } from '../models/filemanager.model';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FilemanagerApiService {

  private setHeader = {
    token: localStorage.getItem('lva_token')
  }

  constructor(
    public http: HttpClient,
  ) { }

  writeFile(data: any): Observable<any> {
    return this.http.post(environment.filemanagerurl + 'new', data, { headers: this.setHeader });
  }
  cancelWriteFile(data: any): Observable<any> {
    return this.http.post(environment.filemanagerurl + `del`, data, { headers: this.setHeader });
  }
  deleteFile(id: number) {
    return this.http.post(environment.filemanagerurl + 'del/' + id, {}, { headers: this.setHeader });
  }

  /** Base: https://filemanager-api.laoapps.com/api/v1/ */
  filemanagerBase(): string {
    const raw = (
      localStorage.getItem('filemanagerurl') ||
      (environment as any).filemanagerurl ||
      (environment as any).serverFile ||
      'https://filemanager-api.laoapps.com/api/v1/'
    ).trim();
    let b = raw.replace(/\/+$/, '');
    b = b.replace(/\/file\/download$/i, '');
    b = b.replace(/\/file$/i, '');          // strip so downloads are /api/v1/…
    b = b.replace(/\/downloadphoto$/i, '');
    if (!/\/api\/v1$/i.test(b) && !b.includes('/api/')) {
      b = b + '/api/v1';
    }
    return b + '/';
  }

  /** Strip DATA/, query, path → hash or pass through http/blob/data. */
  resolveMediaHash(raw: string): string {
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
    s = s.replace(/^\/+/, '');
    s = s.replace(/^DATA\//i, '');
    s = s.replace(/^file\/download\//i, '');
    return s.split('/').pop() || s;
  }

  /** Thumb: /api/v1/downloadphoto?url=HASH&w=&h= */
  downloadPhotoUrl(hash: string, w = 256, h = 256): string {
    if (!hash) return '';
    if (hash.startsWith('data:') || hash.startsWith('blob:')) return hash;
    if (/^https?:\/\//i.test(hash) && !hash.includes('/DATA/')) return hash;
    const id = this.resolveMediaHash(hash);
    return `${this.filemanagerBase()}downloadphoto?url=${encodeURIComponent(id)}&w=${w}&h=${h}`;
  }

  /** Original file / video: /api/v1/file/download/HASH */
  downloadFileUrl(hash: string): string {
    if (!hash) return '';
    if (hash.startsWith('data:') || hash.startsWith('blob:')) return hash;
    if (/^https?:\/\//i.test(hash) && !hash.includes('/DATA/') && !hash.includes('localhost')) {
      return hash;
    }
    const id = this.resolveMediaHash(hash);
    return `${this.filemanagerBase()}file/download/${id}`;
  }
}
