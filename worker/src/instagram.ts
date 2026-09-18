import type { ConnectedAccount, Env, GraphChild, GraphMedia, ResolvedInstagramPost } from './types';

const MAX_PAGES = 2;
const PAGE_SIZE = 25;
const CACHE_SECONDS = 600;

export function parseInstagramUrl(sourceUrl: string) {
  let url: URL;
  try { url = new URL(sourceUrl); } catch { return undefined; }
  if (url.hostname.toLowerCase().replace(/^www\./, '') !== 'instagram.com') return undefined;
  const [pathType, shortcode] = url.pathname.split('/').filter(Boolean);
  if ((pathType !== 'p' && pathType !== 'reel') || !shortcode || !/^[A-Za-z0-9_-]+$/.test(shortcode)) return undefined;
  return { shortcode, normalizedUrl: `https://www.instagram.com/${pathType}/${shortcode}/` };
}

function accountsFromEnv(env: Env): Record<string, ConnectedAccount> {
  if (!env.INSTAGRAM_ACCOUNTS_JSON) throw new Error('Instagram API設定がありません');
  try { return JSON.parse(env.INSTAGRAM_ACCOUNTS_JSON) as Record<string, ConnectedAccount>; } catch { throw new Error('Instagram API設定が正しくありません'); }
}

async function graphMedia(account: ConnectedAccount, env: Env): Promise<GraphMedia[]> {
  const base = env.META_GRAPH_BASE || 'https://graph.facebook.com';
  const version = env.META_GRAPH_VERSION || 'v24.0';
  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{id,media_type,media_url,thumbnail_url}';
  let next = `${base}/${version}/${account.igUserId}/media?fields=${encodeURIComponent(fields)}&limit=${PAGE_SIZE}&access_token=${encodeURIComponent(account.accessToken)}`;
  const result: GraphMedia[] = [];
  for (let page = 0; page < MAX_PAGES && next; page += 1) {
    const response = await fetch(next);
    if (!response.ok) throw new Error('Instagram API request failed');
    const body = await response.json() as { data?: GraphMedia[]; paging?: { next?: string } };
    result.push(...(body.data || []));
    next = body.paging?.next || '';
  }
  return result;
}

function bestImage(media: GraphMedia) {
  if (media.media_type === 'CAROUSEL_ALBUM') {
    const child = media.children?.data?.find((item: GraphChild) => item.media_type === 'IMAGE') || media.children?.data?.[0];
    return { mediaUrl: child?.media_url, thumbnailUrl: child?.thumbnail_url || media.thumbnail_url };
  }
  if (media.media_type === 'VIDEO' || media.media_type === 'REELS') return { mediaUrl: media.thumbnail_url || media.media_url, thumbnailUrl: media.thumbnail_url };
  return { mediaUrl: media.media_url, thumbnailUrl: media.thumbnail_url };
}

export async function resolveInstagramPost(sourceUrl: string, env: Env, cache?: Cache): Promise<ResolvedInstagramPost | undefined> {
  const parsed = parseInstagramUrl(sourceUrl);
  if (!parsed) throw new Error('Instagram投稿URLを正しく読み取れませんでした');
  if (env.INSTAGRAM_MOCK === 'true' && parsed.shortcode === 'TEST123') return { sourceUrl, normalizedUrl: parsed.normalizedUrl, shortcode: parsed.shortcode, mediaType: 'IMAGE', username: 'test_familie', caption: 'テスト用Instagram投稿です', mediaUrl: new URL('/instagram/mock-image', 'https://worker.local').toString(), shopId: 'familie' };
  const cacheKey = new Request(`https://rooms-instagram-cache.invalid/${parsed.shortcode}`);
  if (cache) { const hit = await cache.match(cacheKey); if (hit) return await hit.json() as ResolvedInstagramPost; }
  const accounts = accountsFromEnv(env);
  for (const [shopId, account] of Object.entries(accounts)) {
    const media = await graphMedia(account, env);
    const found = media.find((item) => parseInstagramUrl(item.permalink)?.shortcode === parsed.shortcode);
    if (!found) continue;
    const image = bestImage(found);
    const resolved: ResolvedInstagramPost = { sourceUrl, normalizedUrl: parsed.normalizedUrl, shortcode: parsed.shortcode, mediaType: found.media_type, username: found.username || account.username, caption: found.caption, ...image, timestamp: found.timestamp, shopId };
    if (cache) await cache.put(cacheKey, new Response(JSON.stringify(resolved), { headers: { 'Cache-Control': `max-age=${CACHE_SECONDS}`, 'Content-Type': 'application/json' } }));
    return resolved;
  }
  return undefined;
}

export function allowedImageUrl(value: string, requestOrigin: string) {
  try {
    const url = new URL(value);
    if (url.origin === requestOrigin && url.pathname === '/instagram/mock-image') return true;
    return url.protocol === 'https:' && (url.hostname.endsWith('.cdninstagram.com') || url.hostname.endsWith('.fbcdn.net'));
  } catch { return false; }
}
