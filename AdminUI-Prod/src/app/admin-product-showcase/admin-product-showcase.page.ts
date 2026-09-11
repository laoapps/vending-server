import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { CachingService } from 'src/app/services/caching.service';
import { FilemanagerApiService } from 'src/app/services/filemanager-api.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-admin-product-showcase',
  templateUrl: './admin-product-showcase.page.html',
  styleUrls: ['./admin-product-showcase.page.scss'],
})
export class AdminProductShowcasePage implements OnInit {
  @ViewChild('rt') rt?: ElementRef<HTMLDivElement>;

  stocks: any[] = [];
  gallery: any[] = [];
  selected: any = null;
  q = '';
  form: any = this.empty();
  saving = false;
  uploading = false;
  loadError = '';
  hmLogo = 'assets/icon/logo.png';
  thumbs: Record<string, string> = {};
  /** hash → filemanager record for del */
  fileMeta: Record<string, { id?: number; uuid?: string; url: string }> = {};
  videoPlay = '';
  filemanagerURL =
    ((localStorage.getItem('filemanagerurl') || (environment as any).filemanagerurl || '') as string)
      .replace(/\/?$/, '/') + 'download/';

  constructor(
    public api: ApiService,
    private photos: CachingService,
    private fm: FilemanagerApiService,
    private ref: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadStocks();
    this.loadGallery();
  }

  get filtered(): any[] {
    const q = (this.q || '').trim().toLowerCase();
    if (!q) return this.stocks;
    return this.stocks.filter((s) => {
      const name = String(s?.name || '').toLowerCase();
      const id = String(s?.id ?? '');
      return name.includes(q) || id.includes(q);
    });
  }

  empty() {
    return {
      stockId: null,
      title: '',
      html: '',
      story: '',
      price: 0,
      video: '',
      photos: [] as string[],
      holdMs: 10000,
      videoMs: 12000,
      isActive: true,
    };
  }

  private authBody() {
    return {
      token: localStorage.getItem('lva_token'),
      shopPhonenumber: localStorage.getItem('phoneNumberLocal'),
      secret: localStorage.getItem('secretLocal'),
    };
  }

  private uid(): string {
    return (crypto as any).randomUUID?.() || ('u' + Date.now() + Math.random().toString(16).slice(2));
  }

  photoSrc(hash: string): string {
    if (!hash) return this.hmLogo;
    if (hash.startsWith('data:') || hash.startsWith('blob:')) return hash;
    return this.thumbs[hash] || this.hmLogo;
  }

  onPhotoError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (img) img.src = this.hmLogo;
  }

  loadStocks() {
    this.loadError = '';
    this.api.listProduct('yes').subscribe({
      next: (r: any) => {
        if (r?.status !== 1) {
          this.stocks = [];
          this.loadError = r?.message || 'loadListFail';
          return;
        }
        this.stocks = r.data || [];
        this.hydrateThumbs(this.stocks.map((s) => ({ hash: s.image, date: s.updatedAt })));
      },
      error: (e) => {
        this.stocks = [];
        this.loadError = e?.message || 'listProduct failed';
      },
    });
  }

  loadGallery() {
    this.api.listProductImages('all').subscribe({
      next: (r: any) => {
        this.gallery = r?.status === 1 ? r.data || [] : [];
        this.hydrateThumbs(this.gallery.map((g) => ({ hash: g.imageURL || g.image, date: g.updatedAt })));
      },
      error: () => (this.gallery = []),
    });
  }

  private async hydrateThumbs(items: { hash: string; date?: string | Date }[]) {
    for (const it of items) {
      const hash = it.hash;
      if (!hash || this.thumbs[hash]) continue;
      const url = this.filemanagerURL + hash;
      try {
        const stored = await this.photos.getPhoto(url + hash);
        const hit = this.unwrap(stored);
        if (hit) {
          this.thumbs[hash] = hit;
          continue;
        }
        const raw = await this.photos.saveCachingPhoto(url, new Date(it.date || 0), hash);
        const v = this.unwrap(raw);
        if (v) this.thumbs[hash] = v;
      } catch {}
    }
    this.thumbs = { ...this.thumbs };
    this.ref.detectChanges();
  }

  private unwrap(raw: any): string {
    try {
      const y = typeof raw === 'string' ? JSON.parse(raw) : raw;
      let v = y?.v || y;
      if (typeof v !== 'string') return '';
      if (v.startsWith('data:application/octet-stream')) v = 'data:image/jpeg;base64,' + v.split(',')[1];
      return v.startsWith('data:') ? v : '';
    } catch {
      return typeof raw === 'string' && raw.startsWith('data:') ? raw : '';
    }
  }

  pick(st: any) {
    this.selected = st;
    this.form = this.empty();
    this.form.stockId = st.id;
    this.form.title = st.name;
    this.form.price = Number(st.price) || 0;
    this.form.photos = st.image ? [st.image] : [];
    this.loadOne(st.id);
  }

  loadOne(stockId: number) {
    this.api.http
      .post<any>(
        this.api.url + '/productShowcaseList?stockId=' + stockId,
        this.authBody(),
        { headers: (this.api as any).headerBase() },
      )
      .subscribe({
        next: (r) => {
          const row = (r?.data || [])[0];
          if (row) {
            this.form = {
              ...this.empty(),
              ...row,
              photos: row.photos?.length ? row.photos : this.form.photos,
            };
            this.hydrateThumbs((this.form.photos || []).map((h: string) => ({ hash: h, date: row.updatedAt })));
            this.bindRemoteVideo(this.form.video);
          }
          setTimeout(() => {
            if (this.rt) this.rt.nativeElement.innerHTML = this.form.html || '';
          });
        },
      });
  }

  save() {
    if (!this.form.stockId) return;
    this.syncHtml();
    this.saving = true;
    this.api.http
      .post<any>(
        this.api.url + '/productShowcaseSave',
        { ...this.authBody(), data: this.form },
        { headers: (this.api as any).headerBase() },
      )
      .subscribe({
        next: () => (this.saving = false),
        error: () => (this.saving = false),
      });
  }

  /* ===== filemanager upload / delete ===== */

  onPickFile(ev: Event, kind: 'photo' | 'video') {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.upload(file, kind);
  }

  private async upload(file: File, kind: 'photo' | 'video') {
    this.uploading = true;
    const fileuuid = this.uid();
    const formfile = new FormData();
    formfile.append('docs', file, file.name);
    formfile.append('uuid', fileuuid);
    try {
      const r: any = await firstValueFrom(this.fm.writeFile(formfile));
      if (r?.status != 1) {
        this.fm.cancelWriteFile({ uuid: fileuuid }).subscribe();
        (this.api as any).simpleMessage?.('writeFileFail');
        return;
      }
      const info = r.data?.[0]?.info || r.data?.[0] || {};
      const hash = info.fileUrl || info.url;
      if (!hash) throw new Error('no fileUrl');
      this.fileMeta[hash] = {
        id: info.id ?? r.data?.[0]?.id,
        uuid: fileuuid,
        url: hash,
      };
      const reader = new FileReader();
      reader.onload = () => {
        this.thumbs[hash] = reader.result as string;
        this.thumbs = { ...this.thumbs };
        this.ref.detectChanges();
      };
      reader.readAsDataURL(file);
      if (kind === 'video') {
        this.form.video = hash;
        this.setLocalVideo(file);
      } else this.addPhoto(hash);
    } catch {
      this.fm.cancelWriteFile({ uuid: fileuuid }).subscribe();
    } finally {
      this.uploading = false;
      this.ref.detectChanges();
    }
  }

  addPhoto(hash: string) {
    hash = (hash || '').trim();
    if (!hash) return;
    if (!this.form.photos.includes(hash)) this.form.photos = [...this.form.photos, hash];
    this.hydrateThumbs([{ hash }]);
  }

  addFromGallery(g: any) {
    const hash = g?.imageURL || g?.image;
    this.addPhoto(hash);
    if (hash) {
      this.fileMeta[hash] = {
        id: g.id,
        uuid: g.uuid,
        url: hash,
      };
    }
  }

  private delFile(hash: string) {
    const meta = this.fileMeta[hash];
    const id = Number(meta?.id);
    if (!id) {
      (this.api as any).simpleMessage?.('File id missing — cannot del');
      return;
    }
    this.fm.deleteFile(id).subscribe();
    delete this.fileMeta[hash];
    delete this.thumbs[hash];
  }

  deletePhoto(i: number) {
    const hash = this.form.photos[i];
    if (!hash) return;
    if (!confirm('Delete this photo from filemanager?')) return;
    this.delFile(hash);
    this.form.photos = this.form.photos.filter((_, x) => x !== i);
  }

  deleteVideo() {
    if (!this.form.video) return;
    if (!confirm('Delete this video from filemanager?')) return;
    this.delFile(this.form.video);
    this.form.video = '';
    this.clearVideoPlay();
  }

  videoUrl(hash: string): string {
    return this.fm.downloadFileUrl(hash);
  }

  private setLocalVideo(file: File) {
    this.clearVideoPlay();
    const typed = file.type.startsWith('video/')
      ? file
      : new File([file], file.name || 'v.mp4', { type: 'video/mp4' });
    this.videoPlay = URL.createObjectURL(typed);
    this.ref.detectChanges();
  }

  private async bindRemoteVideo(hash: string) {
    this.clearVideoPlay();
    if (!hash) return;
    const url = this.fm.downloadFileUrl(hash);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const typed = blob.type.startsWith('video/')
        ? blob
        : new Blob([await blob.arrayBuffer()], { type: 'video/mp4' });
      this.videoPlay = URL.createObjectURL(typed);
    } catch {
      this.videoPlay = url;
    }
    this.ref.detectChanges();
  }

  private clearVideoPlay() {
    if (this.videoPlay?.startsWith('blob:')) {
      try { URL.revokeObjectURL(this.videoPlay); } catch {}
    }
    this.videoPlay = '';
  }

  /* ===== rich text (no extra npm) ===== */

  fmt(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    this.syncHtml();
  }

  onHtmlInput() {
    this.syncHtml();
  }

  private syncHtml() {
    this.form.html = this.rt?.nativeElement?.innerHTML || this.form.html || '';
  }
}