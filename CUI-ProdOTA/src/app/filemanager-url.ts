import { environment } from 'src/environments/environment';

/**
 * Always: https://filemanager-api.laoapps.com/api/v1/file/
 *
 * photo  →  {base}downloadphoto?url=HASH&w=&h=
 * file   →  {base}download/HASH
 */
export function filemanagerBase(): string {
  const raw = (
    localStorage.getItem('filemanagerurl') ||
    (environment as any).filemanagerurl ||
    (environment as any).serverFile ||
    'https://filemanager-api.laoapps.com/api/v1/file/'
  ).trim();
  let b = raw.replace(/\/+$/, '');
  b = b.replace(/\/downloadphoto$/i, '');
  b = b.replace(/\/file\/download$/i, '');
  b = b.replace(/\/download$/i, '');
  if (/\/api\/v1$/i.test(b)) b = b + '/file';
  if (!/\/file$/i.test(b) && !b.includes('/api/')) b = b + '/api/v1/file';
  return b + '/';
}

export function resolveMediaHash(raw: string): string {
  if (!raw) return '';
  let s = String(raw).trim();
  if (s.startsWith('data:') || s.startsWith('blob:')) return s;
  if (/^https?:\/\//i.test(s)) {
    if (s.includes('/DATA/')) return s.split('/DATA/').pop() || s;
    const q = s.match(/[?&]url=([^&]+)/);
    if (q) return decodeURIComponent(q[1]);
    const dl = s.match(/\/(?:file\/)?download\/([^/?#]+)/);
    if (dl) return dl[1];
    return s;
  }
  s = s.replace(/^\/+/, '').replace(/^DATA\//i, '').replace(/^file\/download\//i, '');
  return s.split('/').pop() || s;
}

export function downloadPhotoUrl(hash: string, w = 256, h = 256): string {
  if (!hash) return '';
  if (hash.startsWith('data:') || hash.startsWith('blob:')) return hash;
  const id = resolveMediaHash(hash);
  return `${filemanagerBase()}downloadphoto?url=${encodeURIComponent(id)}&w=${w}&h=${h}`;
}

export function downloadFileUrl(hash: string): string {
  if (!hash) return '';
  if (hash.startsWith('data:') || hash.startsWith('blob:')) return hash;
  const id = resolveMediaHash(hash);
  return `${filemanagerBase()}download/${id}`;
}