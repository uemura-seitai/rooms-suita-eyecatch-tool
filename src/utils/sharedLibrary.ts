import type { LibraryImage, LibraryPostType } from './imageLibrary';

export type SharedLibraryImage = Omit<LibraryImage, 'image'>;
export type SharedLibraryFailure = 'hostname' | 'certificate' | 'cors' | 'unreachable' | 'api';
export const SHARED_LIBRARY_URL_KEY = 'rooms:shared-library-url';
// Bonjour keeps this address stable when the Wi-Fi IP changes. It is the
// LocalHostName reported by this Mac when this integration was configured.
export const DEFAULT_SHARED_LIBRARY_URL = 'https://uemuranaoyanoMacBook-Pro.local:8787';

export function getSharedLibraryUrl() {
  const configured = localStorage.getItem(SHARED_LIBRARY_URL_KEY)?.replace(/\/$/, '');
  // Retain the stored value only as an emergency/developer override. Normal
  // users never need to enter an IP address or URL.
  // Ignore the legacy HTTP/IP value used by older releases: it would trigger
  // mixed-content blocking from GitHub Pages. HTTPS remains available only
  // as a developer emergency override.
  if (configured?.startsWith('https://')) return configured;
  // Remove the URL saved by the pre-HTTPS release so it cannot be selected
  // on a later visit from GitHub Pages.
  if (configured) localStorage.removeItem(SHARED_LIBRARY_URL_KEY);
  return DEFAULT_SHARED_LIBRARY_URL;
}
export function setSharedLibraryUrl(value: string) { localStorage.setItem(SHARED_LIBRARY_URL_KEY, value.trim().replace(/\/$/, '')); }
function baseUrl() { const value = getSharedLibraryUrl(); if (!value) throw new Error('共有ライブラリはMacが起動している時のみ利用できます。'); return value; }
export class SharedLibraryRequestError extends Error {
  constructor(public readonly failure: SharedLibraryFailure, message: string) { super(message); }
}
function connectionError(caught: unknown) {
  const detail = caught instanceof Error ? caught.message.toLowerCase() : '';
  if (/certificate|cert|ssl|secure connection/.test(detail)) return new SharedLibraryRequestError('certificate', '共有ライブラリの証明書を確認してください。');
  if (/cors|cross-origin|origin/.test(detail)) return new SharedLibraryRequestError('cors', '共有ライブラリの接続許可を確認してください。');
  if (/dns|resolve|name not known|hostname/.test(detail)) return new SharedLibraryRequestError('hostname', 'Macの名前を見つけられません。同じWi-Fiに接続してください。');
  return new SharedLibraryRequestError('unreachable', '共有ライブラリはMacが起動している時のみ利用できます。');
}
async function request(path: string, init?: RequestInit) {
  let response: Response;
  try { response = await fetch(`${baseUrl()}${path}`, init); } catch (caught) { throw connectionError(caught); }
  if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new SharedLibraryRequestError('api', detail.error || '共有ライブラリの操作に失敗しました。'); }
  return response;
}
export async function listSharedLibraryImages() { return (await (await request('/api/images')).json()) as SharedLibraryImage[]; }
export async function isSharedLibraryAvailable() { try { return (await request('/api/health')).ok; } catch { return false; } }
export function sharedLibraryFileUrl(id: string) { return `${baseUrl()}/api/images/${encodeURIComponent(id)}/file`; }
export async function getSharedLibraryImageBlob(id: string) { return (await request(`/api/images/${encodeURIComponent(id)}/file`)).blob(); }
export async function saveSharedLibraryImage(input: { image: Blob; title: string; postType: LibraryPostType; sourceUrl?: string; shopName?: string; memo?: string }) {
  const data = new FormData(); data.append('image', input.image, 'rooms-image.png'); data.append('title', input.title); data.append('postType', input.postType); data.append('sourceUrl', input.sourceUrl || ''); data.append('shopName', input.shopName || ''); data.append('memo', input.memo || '');
  return (await (await request('/api/images', { method: 'POST', body: data })).json()) as SharedLibraryImage;
}
export async function updateSharedLibraryImage(id: string, update: Partial<Pick<SharedLibraryImage, 'title' | 'postType' | 'sourceUrl' | 'shopName' | 'memo'>>) { return (await (await request(`/api/images/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) })).json()) as SharedLibraryImage; }
export async function deleteSharedLibraryImage(id: string) { await request(`/api/images/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
