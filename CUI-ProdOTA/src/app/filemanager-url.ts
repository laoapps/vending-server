import { environment } from 'src/environments/environment';

/** Base: https://filemanager-api.laoapps.com/api/v1/ */
/** Base: https://filemanager-api.laoapps.com/api/v1/ */
export function filemanagerBase(): string {
  const raw = (
    localStorage.getItem('filemanagerurl') ||
    (environment as any).filemanagerurl ||
    (environment as any).serverFile ||
    'https://filemanager-api.laoapps.com/api/v1/'
  ).trim();
  let b = raw.replace(/\/+$/, '');
  b = b.replace(/\/file\/download$/i, '');
  b = b.replace(/\/downloadphoto$/i, '');
  if (!/\/api\/v1$/i.test(b) && !b.includes('/api/')) {
    b = b + '/api/v1';
  }
  return b + '/';
}

/** Thumb: /api/v1/downloadphoto?url=HASH&w=&h= */
export function downloadPhotoUrl(hash: string, w = 256, h = 256): string {
  if (!hash) return '';
  if (hash.startsWith('data:') || hash.startsWith('blob:') || hash.startsWith('http')) {
    return hash;
  }
  return `${filemanagerBase()}downloadphoto?url=${encodeURIComponent(hash)}&w=${w}&h=${h}`;
}

/** Original file: /api/v1/file/download/HASH */
export function downloadFileUrl(hash: string): string {
  if (!hash) return '';
  if (hash.startsWith('data:') || hash.startsWith('blob:') || hash.startsWith('http')) {
    return hash;
  }
  return `${filemanagerBase()}file/download/${hash}`;
}