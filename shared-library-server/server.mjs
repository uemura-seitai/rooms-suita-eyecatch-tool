/**
 * ROOMs shared image library.  Deliberately dependency-free so it can be
 * started on a Mac with the project's existing Node.js installation.
 */
import https from 'node:https';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../shared-library-data');
const imagesDir = path.join(root, 'images');
const libraryFile = path.join(root, 'library.json');
const port = Number(process.env.SHARED_LIBRARY_PORT || 8787);
const maxBody = 25 * 1024 * 1024;
const certificatesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.local-certs');
const certificateFile = path.join(certificatesDir, 'server-cert.pem');
const privateKeyFile = path.join(certificatesDir, 'server-key.pem');
const githubPagesOrigin = 'https://uemura-seitai.github.io';

const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
const safeName = (value) => String(value || '').replace(/[^a-zA-Z0-9._-]/g, '_');
const contentTypeFor = (name) => ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(name).toLowerCase()] || 'application/octet-stream');
const isDevelopmentOrigin = (origin) => {
  try { const host = new URL(origin).hostname; return host === 'localhost' || host === '127.0.0.1' || host === '::1' || /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host); } catch { return false; }
};
function cors(req, res) {
  const origin = req.headers.origin;
  // The public app is the only production origin. Development origins are
  // intentionally limited to LAN/loopback hosts rather than using "*".
  if (origin && (origin === githubPagesOrigin || isDevelopmentOrigin(origin))) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Required by Chromium when a public HTTPS page reaches a LAN device.
  if (req.headers['access-control-request-private-network'] === 'true') res.setHeader('Access-Control-Allow-Private-Network', 'true');
}
async function setup() { await mkdir(imagesDir, { recursive: true }); if (!existsSync(libraryFile)) await writeFile(libraryFile, '[]\n'); }
async function readLibrary() { await setup(); try { const parsed = JSON.parse(await readFile(libraryFile, 'utf8')); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
async function writeLibrary(records) { const temp = `${libraryFile}.tmp`; await writeFile(temp, `${JSON.stringify(records, null, 2)}\n`); await rename(temp, libraryFile); }
function body(req) { return new Promise((resolve, reject) => { const chunks = []; let size = 0; req.on('data', (part) => { size += part.length; if (size > maxBody) { reject(new Error('画像は25MB以下にしてください。')); req.destroy(); return; } chunks.push(part); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
function multipart(buffer, contentType) {
  const found = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || ''); if (!found) throw new Error('multipart/form-data が必要です。');
  const boundary = Buffer.from(`--${found[1] || found[2]}`); const fields = {}; let file;
  for (let start = buffer.indexOf(boundary) + boundary.length + 2; start > boundary.length + 1 && start < buffer.length; ) {
    const end = buffer.indexOf(boundary, start); if (end < 0) break; const part = buffer.subarray(start, end - 2); const divider = part.indexOf(Buffer.from('\r\n\r\n'));
    if (divider >= 0) { const headers = part.subarray(0, divider).toString('utf8'); const value = part.subarray(divider + 4); const name = /name="([^"]+)"/.exec(headers)?.[1]; const filename = /filename="([^"]*)"/.exec(headers)?.[1]; if (filename !== undefined) file = { filename, type: /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1] || 'application/octet-stream', data: value }; else if (name) fields[name] = value.toString('utf8'); }
    start = end + boundary.length + 2;
  }
  return { fields, file };
}
function publicRecord(record) { const { filename, ...meta } = record; return meta; }

if (!existsSync(certificateFile) || !existsSync(privateKeyFile)) {
  console.error('HTTPS certificate is missing. Run: npm run setup-local-https');
  process.exit(1);
}

await setup();
https.createServer({ cert: await readFile(certificateFile), key: await readFile(privateKeyFile) }, async (req, res) => {
  cors(req, res); if (req.method === 'OPTIONS') return res.end();
  const url = new URL(req.url || '/', `http://${req.headers.host}`); const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/api/images') return json(res, 200, (await readLibrary()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicRecord));
    if (req.method === 'POST' && url.pathname === '/api/images') {
      const { fields, file } = multipart(await body(req), req.headers['content-type']);
      if (!file?.data.length || !/^image\/(png|jpeg|webp)$/i.test(file.type)) throw new Error('PNG、JPEG、WebP画像を選択してください。');
      const extension = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
      const id = randomUUID(); const filename = `${id}${extension}`;
      const record = { id, filename, title: String(fields.title || ''), postType: ['radio', 'health', 'notice', 'other'].includes(fields.postType) ? fields.postType : 'other', createdAt: new Date().toISOString(), sourceUrl: String(fields.sourceUrl || ''), shopName: String(fields.shopName || ''), memo: String(fields.memo || '') };
      await writeFile(path.join(imagesDir, filename), file.data); const records = await readLibrary(); records.push(record); await writeLibrary(records);
      return json(res, 201, publicRecord(record));
    }
    if (parts[0] !== 'api' || parts[1] !== 'images' || !parts[2]) return json(res, 404, { error: 'Not found' });
    const id = parts[2]; const records = await readLibrary(); const index = records.findIndex((record) => record.id === id);
    if (req.method === 'GET' && parts[3] === 'file') { if (index < 0) return json(res, 404, { error: 'Not found' }); const data = await readFile(path.join(imagesDir, safeName(records[index].filename))); res.writeHead(200, { 'Content-Type': contentTypeFor(records[index].filename), 'Cache-Control': 'private, max-age=3600' }); return res.end(data); }
    if (req.method === 'GET' && !parts[3]) return index < 0 ? json(res, 404, { error: 'Not found' }) : json(res, 200, publicRecord(records[index]));
    if (req.method === 'DELETE' && !parts[3]) { if (index < 0) return json(res, 404, { error: 'Not found' }); const [removed] = records.splice(index, 1); await writeLibrary(records); await rm(path.join(imagesDir, safeName(removed.filename)), { force: true }); return res.writeHead(204).end(); }
    if (req.method === 'PUT' && !parts[3]) { if (index < 0) return json(res, 404, { error: 'Not found' }); const update = JSON.parse((await body(req)).toString('utf8')); for (const key of ['title', 'postType', 'sourceUrl', 'shopName', 'memo']) if (key in update) records[index][key] = typeof update[key] === 'string' ? update[key] : ''; await writeLibrary(records); return json(res, 200, publicRecord(records[index])); }
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) { return json(res, 400, { error: error instanceof Error ? error.message : 'Request failed' }); }
}).listen(port, '0.0.0.0', () => console.log(`Shared library API: https://0.0.0.0:${port}`));
