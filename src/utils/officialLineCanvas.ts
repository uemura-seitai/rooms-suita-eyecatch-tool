import headerNews from '../assets/official-line/header-news.png';

export type OfficialLineItemType = 'radio' | 'health' | 'notice';
export type OfficialLineSlot = { enabled: boolean; type: OfficialLineItemType; title: string; imageId?: string; uploadedImage?: string; scale: number; offsetX: number; offsetY: number; linkUrl: string };
export type OfficialLineState = { slots: OfficialLineSlot[] };

export const LINE_CANVAS = { width: 1080, height: 1920 };
export const lineTypeLabel: Record<OfficialLineItemType, string> = { radio: 'ラジオ', health: '健康情報', notice: 'お知らせ投稿' };
export const lineTypeColor: Record<OfficialLineItemType, string> = { radio: '#f6b7c8', health: '#aee1ed', notice: '#f8df84' };
const font = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

const slot = (type: OfficialLineItemType, title: string): OfficialLineSlot => ({ enabled: true, type, title, scale: 1, offsetX: 0, offsetY: 0, linkUrl: '' });
export const defaultOfficialLineState = (): OfficialLineState => ({ slots: [slot('radio', 'ROOMsラジオ'), slot('health', '健康情報'), slot('notice', 'お知らせ投稿')] });

function load(src: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
function fittedTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number) { for (let size = start; size >= 28; size -= 2) { ctx.font = `800 ${size}px ${font}`; if (ctx.measureText(text).width <= maxWidth) return size; } return 28; }
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, scale: number, offsetX: number, offsetY: number) {
  const base = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawW = image.naturalWidth * base; const drawH = image.naturalHeight * base;
  const extraX = Math.max(0, drawW - width); const extraY = Math.max(0, drawH - height);
  ctx.drawImage(image, x + (width - drawW) / 2 + extraX * (offsetX / 100), y + (height - drawH) / 2 + extraY * (offsetY / 100), drawW, drawH);
}

export async function renderOfficialLine(canvas: HTMLCanvasElement, state: OfficialLineState) {
  canvas.width = LINE_CANVAS.width; canvas.height = LINE_CANVAS.height;
  const ctx = canvas.getContext('2d')!; const { width } = LINE_CANVAS;
  ctx.fillStyle = '#5aabd0'; ctx.fillRect(0, 0, width, LINE_CANVAS.height);
  const header = await load(headerNews);
  const headerHeight = width * header.naturalHeight / header.naturalWidth;
  ctx.drawImage(header, 0, 0, width, headerHeight);
  const imagePromises = state.slots.map((item) => item.enabled && item.uploadedImage ? load(item.uploadedImage).catch(() => undefined) : Promise.resolve(undefined));
  const images = await Promise.all(imagePromises);
  state.slots.forEach((item, index) => {
    const y = Math.ceil(headerHeight) + 30 + index * 460; const x = 48; const cardW = 984; const titleH = 105; const imageY = y + titleH;
    ctx.fillStyle = 'rgba(33, 78, 112, .20)'; ctx.fillRect(x + 8, y + 10, cardW, 430);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, cardW, 430);
    ctx.fillStyle = item.enabled ? lineTypeColor[item.type] : '#d9e0e4'; ctx.fillRect(x, y, cardW, titleH);
    ctx.fillStyle = 'rgba(255,255,255,.48)'; ctx.beginPath(); ctx.arc(940, y + 52, 46, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(884, y + 52, 26, 0, Math.PI * 2); ctx.fill();
    const size = fittedTitle(ctx, item.title || ' ', 790, 42); ctx.font = `800 ${size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.strokeText(item.title || ' ', 470, y + 54, 790); ctx.fillStyle = '#1f2730'; ctx.fillText(item.title || ' ', 470, y + 54, 790);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 14, imageY + 14, cardW - 28, 282); ctx.clip();
    if (item.enabled && images[index]) drawCover(ctx, images[index]!, x + 14, imageY + 14, cardW - 28, 282, item.scale, item.offsetX, item.offsetY);
    else { ctx.fillStyle = '#edf2f4'; ctx.fillRect(x + 14, imageY + 14, cardW - 28, 282); ctx.fillStyle = '#78909c'; ctx.font = `700 28px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.enabled ? '画像を選択してください' : 'この投稿枠は使用しません', width / 2, imageY + 155); }
    ctx.restore(); ctx.strokeStyle = '#dbe6eb'; ctx.lineWidth = 2; ctx.strokeRect(x + 14, imageY + 14, cardW - 28, 282);
  });
}
