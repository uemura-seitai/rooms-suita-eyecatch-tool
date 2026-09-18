export type InstagramMediaType = 'post' | 'reel' | 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL_ALBUM';
export type InstagramPostData = {
  sourceUrl: string;
  normalizedUrl: string;
  shortcode: string;
  mediaType: InstagramMediaType;
  username?: string;
  caption?: string;
  mediaUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  timestamp?: string;
  shopId?: string;
};

export type InstagramParseResult = { data: InstagramPostData } | { error: 'empty' | 'not-instagram' | 'malformed' };

export function parseInstagramUrl(sourceUrl: string): InstagramParseResult {
  if (!sourceUrl.trim()) return { error: 'empty' };
  let url: URL;
  try { url = new URL(sourceUrl.trim()); } catch { return { error: 'malformed' }; }
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (hostname !== 'instagram.com') return { error: 'not-instagram' };
  const [mediaType, shortcode] = url.pathname.split('/').filter(Boolean);
  if ((mediaType !== 'p' && mediaType !== 'reel') || !shortcode || !/^[A-Za-z0-9_-]+$/.test(shortcode)) return { error: 'malformed' };
  const type: InstagramMediaType = mediaType === 'p' ? 'post' : 'reel';
  return { data: { sourceUrl, normalizedUrl: `https://www.instagram.com/${mediaType}/${shortcode}/`, shortcode, mediaType: type } };
}

// A future backend URL can be supplied as VITE_INSTAGRAM_API_URL. No access
// token is ever read or stored by this client-side application.
export async function fetchInstagramPost(post: InstagramPostData, apiUrl = import.meta.env.VITE_INSTAGRAM_API_URL): Promise<InstagramPostData | undefined> {
  if (!apiUrl) return undefined;
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/instagram/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: post.normalizedUrl }) });
  const body = await response.json() as { ok?: boolean; post?: Partial<InstagramPostData>; error?: string; code?: string };
  if (!response.ok || !body.ok || !body.post) { const error = new Error(body.error || 'Instagram投稿の取得に失敗しました。もう一度お試しください。'); (error as Error & { code?: string }).code = body.code; throw error; }
  return { ...post, ...body.post };
}

export type InstagramFormTarget = { shop?: string; imageUrl?: string; instagramCaption?: string; instagramUrl?: string };

// Deliberately does not invent values: only API-provided fields are applied.
export function applyInstagramPostToForm(post: InstagramPostData): InstagramFormTarget {
  return { shop: post.shopId, imageUrl: post.mediaUrl || post.imageUrl || post.thumbnailUrl, instagramCaption: post.caption, instagramUrl: post.normalizedUrl };
}

export const instagramImageProxyUrl = (imageUrl: string, apiUrl = import.meta.env.VITE_INSTAGRAM_API_URL) => apiUrl ? `${apiUrl.replace(/\/$/, '')}/instagram/image-proxy?url=${encodeURIComponent(imageUrl)}` : imageUrl;
