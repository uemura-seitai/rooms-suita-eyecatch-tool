import headerNews from '../assets/official-line/header-news.png';

export type OfficialLineItemType = 'radio' | 'health' | 'notice';
export type OfficialLineSlot = { enabled: boolean; type: OfficialLineItemType; title: string; imageId?: string; uploadedImage?: string; scale: number; offsetX: number; offsetY: number; titleFontSize: number; linkUrl: string };
export type OfficialLineState = { slots: OfficialLineSlot[] };

export const LINE_CANVAS = { width: 1080, height: 1920 };
export const lineTypeLabel: Record<OfficialLineItemType, string> = { radio: 'ラジオ', health: '健康情報', notice: 'お知らせ投稿' };
export const lineTypeColor: Record<OfficialLineItemType, string> = { radio: '#f6b7c8', health: '#aee1ed', notice: '#f8df84' };
const font = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

/**
 * `scale` is relative to the automatically calculated cover scale.  Therefore
 * 1 is not a fixed source-image size: each image is first scaled to fill its
 * own image area, then this value is applied as the user's zoom adjustment.
 */
export const defaultImagePosition = () => ({ scale: 1, offsetX: 0, offsetY: 0 });

const slot = (type: OfficialLineItemType, title: string): OfficialLineSlot => ({ enabled: true, type, title, ...defaultImagePosition(), titleFontSize: 46, linkUrl: '' });
export const defaultOfficialLineState = (): OfficialLineState => ({ slots: [slot('radio', 'ROOMsラジオ'), slot('health', '健康情報'), slot('notice', 'お知らせ投稿')] });

function load(src: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
type TitleLayout = { size: number; lines: string[] };

function titleLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const character of Array.from(text)) {
    const next = line + character;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = character; }
    else line = next;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}

function fitTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, requestedSize: number): TitleLayout {
  const safeText = text || ' ';
  // Keep short titles at the user-selected size. Only shrink a one-line title
  // when it really needs it, then use at most two lines for longer text.
  for (let size = requestedSize; size >= 28; size -= 1) {
    ctx.font = `800 ${size}px ${font}`;
    if (ctx.measureText(safeText).width <= maxWidth) return { size, lines: [safeText] };
  }
  for (let size = requestedSize; size >= 28; size -= 1) {
    ctx.font = `800 ${size}px ${font}`;
    const lines = titleLines(ctx, safeText, maxWidth);
    if (lines.length <= 2) return { size, lines };
  }
  ctx.font = `800 28px ${font}`;
  const lines = titleLines(ctx, safeText, maxWidth);
  // A deliberately very long title still remains inside the band. The second
  // line is ellipsized rather than allowing a third line to overflow.
  if (lines.length > 2) {
    let second = lines.slice(1).join('');
    while (second && ctx.measureText(`${second}…`).width > maxWidth) second = second.slice(0, -1);
    return { size: 28, lines: [lines[0], `${second}…`] };
  }
  return { size: 28, lines };
}
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, scale: number, offsetX: number, offsetY: number) {
  const base = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawW = image.naturalWidth * base; const drawH = image.naturalHeight * base;
  const extraX = Math.max(0, drawW - width); const extraY = Math.max(0, drawH - height);
  // -100 and +100 move the image exactly to either crop edge.  Zero is the
  // visual center, and no slider value exposes an unpainted edge.
  ctx.drawImage(image, x + (width - drawW) / 2 + extraX * (offsetX / 200), y + (height - drawH) / 2 + extraY * (offsetY / 200), drawW, drawH);
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
    const y = Math.ceil(headerHeight) + 30 + index * 460; const x = 48; const cardW = 984; const cardH = 440; const titleH = 116; const imageY = y + titleH; const imageH = 296;
    ctx.fillStyle = 'rgba(33, 78, 112, .20)'; ctx.fillRect(x + 8, y + 10, cardW, cardH);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, cardW, cardH);
    ctx.fillStyle = item.enabled ? lineTypeColor[item.type] : '#d9e0e4'; ctx.fillRect(x, y, cardW, titleH);
    ctx.fillStyle = 'rgba(255,255,255,.48)'; ctx.beginPath(); ctx.arc(940, y + 52, 46, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(884, y + 52, 26, 0, Math.PI * 2); ctx.fill();
    const titleX = 480; const titleWidth = 760; const layout = fitTitle(ctx, item.title, titleWidth, item.titleFontSize);
    ctx.font = `800 ${layout.size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round';
    const lineHeight = layout.size * 1.08; const firstLineY = y + titleH / 2 - (layout.lines.length - 1) * lineHeight / 2;
    layout.lines.forEach((line, lineIndex) => { const lineY = firstLineY + lineIndex * lineHeight; ctx.strokeText(line, titleX, lineY, titleWidth); ctx.fillStyle = '#1f2730'; ctx.fillText(line, titleX, lineY, titleWidth); });
    ctx.save(); ctx.beginPath(); ctx.rect(x + 14, imageY + 14, cardW - 28, imageH); ctx.clip();
    if (item.enabled && images[index]) drawCover(ctx, images[index]!, x + 14, imageY + 14, cardW - 28, imageH, item.scale, item.offsetX, item.offsetY);
    else { ctx.fillStyle = '#edf2f4'; ctx.fillRect(x + 14, imageY + 14, cardW - 28, imageH); ctx.fillStyle = '#78909c'; ctx.font = `700 28px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.enabled ? '画像を選択してください' : 'この投稿枠は使用しません', width / 2, imageY + 14 + imageH / 2); }
    ctx.restore(); ctx.strokeStyle = '#dbe6eb'; ctx.lineWidth = 2; ctx.strokeRect(x + 14, imageY + 14, cardW - 28, imageH);
  });
}
