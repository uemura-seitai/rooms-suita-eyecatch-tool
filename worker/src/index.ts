import { allowedImageUrl, resolveInstagramPost } from './instagram';
import type { Env } from './types';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method === 'GET' && url.pathname === '/instagram/mock-image') return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#f8dfe7"/><text x="60" y="300" font-size="48" fill="#963a57">Instagram mock image</text></svg>', { headers: { ...cors, 'Content-Type': 'image/svg+xml' } });
    if (request.method === 'GET' && url.pathname === '/instagram/image-proxy') {
      const imageUrl = url.searchParams.get('url');
      if (!imageUrl || !allowedImageUrl(imageUrl, url.origin)) return json({ ok: false, error: '画像URLは許可されていません' }, 400);
      const image = await fetch(imageUrl);
      if (!image.ok || !image.headers.get('Content-Type')?.startsWith('image/')) return json({ ok: false, error: '画像を取得できませんでした' }, 502);
      return new Response(image.body, { headers: { ...cors, 'Content-Type': image.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=600' } });
    }
    if (request.method === 'POST' && url.pathname === '/instagram/resolve') {
      let body: { url?: string }; try { body = await request.json() as { url?: string }; } catch { return json({ ok: false, error: 'Instagram投稿URLを正しく読み取れませんでした' }, 400); }
      try { const cache = (caches as unknown as { default?: Cache }).default; const post = await resolveInstagramPost(body.url || '', env, cache); if (post?.mediaUrl?.startsWith('https://worker.local/')) post.mediaUrl = post.mediaUrl.replace('https://worker.local', url.origin); return post ? json({ ok: true, post }) : json({ ok: false, code: 'NOT_FOUND', error: '接続済み加盟店のInstagramからこの投稿を見つけられませんでした。' }, 404); } catch (error) { const message = error instanceof Error ? error.message : 'Instagram投稿の取得に失敗しました。もう一度お試しください。'; return json({ ok: false, code: message.includes('設定') ? 'NOT_CONFIGURED' : 'API_ERROR', error: message }, message.includes('設定') ? 503 : 502); }
    }
    return json({ ok: false, error: 'Not found' }, 404);
  },
};
