import type { LibraryImage, LibraryPostType } from './imageLibrary';

export type SharedLibraryImage = Omit<LibraryImage, 'image'>;
export const SHARED_LIBRARY_URL_KEY = 'rooms:shared-library-url';

export function getSharedLibraryUrl() {
  const configured = localStorage.getItem(SHARED_LIBRARY_URL_KEY)?.replace(/\/$/, '');
  // `npm run local-share` serves Vite on a port and the API on 8787 from the
  // same Mac. This avoids having to type the Mac IP on every device.
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location.port && /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname)) return `${window.location.protocol}//${window.location.hostname}:8787`;
  return '';
}
export function setSharedLibraryUrl(value: string) { localStorage.setItem(SHARED_LIBRARY_URL_KEY, value.trim().replace(/\/$/, '')); }
function baseUrl() { const value = getSharedLibraryUrl(); if (!value) throw new Error('共有ライブラリはMacが起動している時のみ利用できます。'); return value; }
async function request(path: string, init?: RequestInit) {
  let response: Response;
  try { response = await fetch(`${baseUrl()}${path}`, init); } catch { throw new Error('共有ライブラリはMacが起動している時のみ利用できます。'); }
  if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.error || '共有ライブラリの操作に失敗しました。'); }
  return response;
}
export async function listSharedLibraryImages() { return (await (await request('/api/images')).json()) as SharedLibraryImage[]; }
export function sharedLibraryFileUrl(id: string) { return `${baseUrl()}/api/images/${encodeURIComponent(id)}/file`; }
export async function getSharedLibraryImageBlob(id: string) { return (await request(`/api/images/${encodeURIComponent(id)}/file`)).blob(); }
export async function saveSharedLibraryImage(input: { image: Blob; title: string; postType: LibraryPostType; sourceUrl?: string; shopName?: string; memo?: string }) {
  const data = new FormData(); data.append('image', input.image, 'rooms-image.png'); data.append('title', input.title); data.append('postType', input.postType); data.append('sourceUrl', input.sourceUrl || ''); data.append('shopName', input.shopName || ''); data.append('memo', input.memo || '');
  return (await (await request('/api/images', { method: 'POST', body: data })).json()) as SharedLibraryImage;
}
export async function updateSharedLibraryImage(id: string, update: Partial<Pick<SharedLibraryImage, 'title' | 'postType' | 'sourceUrl' | 'shopName' | 'memo'>>) { return (await (await request(`/api/images/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) })).json()) as SharedLibraryImage; }
export async function deleteSharedLibraryImage(id: string) { await request(`/api/images/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
