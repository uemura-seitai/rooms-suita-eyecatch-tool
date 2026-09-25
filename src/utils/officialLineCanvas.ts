import headerNews from '../assets/official-line/header-news.png';

export type OfficialLineItemType = 'radio' | 'health' | 'notice';
export type OfficialLineSlot = { enabled: boolean; type: OfficialLineItemType; title: string; imageId?: string; uploadedImage?: string; scale: number; offsetX: number; offsetY: number; titleFontSize: number; linkUrl: string };
export type OfficialLineState = { slots: OfficialLineSlot[] };

export const LINE_CANVAS = { width: 1040, height: 1850 };
export const lineTypeLabel: Record<OfficialLineItemType, string> = { radio: 'ラジオ', health: '健康情報', notice: 'お知らせ投稿' };
export const lineTypeColor: Record<OfficialLineItemType, string> = { radio: '#f6b7c8', health: '#aee1ed', notice: '#f8df84' };
const font = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
const cardX = 32;
const cardWidth = 976;
const imageInset = 10;
const titleHeight = 86;
const imageWidth = cardWidth - imageInset * 2;
// This deliberately wider-than-16:9 window removes the repeated header and
// empty edges found in site eye-catches while retaining their main content.
const imageHeight = 332;
const cardHeight = titleHeight + imageInset + imageHeight + imageInset;
const slotGap = 14;

export const officialLineSlotDefaults: Record<OfficialLineItemType, Pick<OfficialLineSlot, 'scale' | 'offsetX' | 'offsetY' | 'titleFontSize'>> = {
  // Radio eye-catches put the useful NEWS bar at their lower edge. The card
  // title replaces the repeated source title, so this crop prioritizes the
  // host portrait and the complete NEWS bar.
  radio: { scale: 1, offsetX: 0, offsetY: -100, titleFontSize: 46 },
  // Health and notice cards are balanced toward their photo/body area and
  // trim the repeated source heading and surplus top whitespace.
  health: { scale: 1, offsetX: 0, offsetY: -20, titleFontSize: 46 },
  notice: { scale: 1, offsetX: 0, offsetY: -35, titleFontSize: 46 },
};

/**
 * `scale` is relative to the automatically calculated cover scale.  Therefore
 * 1 is not a fixed source-image size: each image is first scaled to fill its
 * own image area, then this value is applied as the user's zoom adjustment.
 */
export const defaultImagePosition = (type: OfficialLineItemType) => {
  const { scale, offsetX, offsetY } = officialLineSlotDefaults[type];
  return { scale, offsetX, offsetY };
};

const slot = (type: OfficialLineItemType, title: string): OfficialLineSlot => ({ enabled: true, type, title, ...officialLineSlotDefaults[type], linkUrl: '' });
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
    const y = Math.ceil(headerHeight) + 16 + index * (cardHeight + slotGap); const x = cardX; const imageY = y + titleHeight;
    ctx.fillStyle = 'rgba(33, 78, 112, .20)'; ctx.fillRect(x + 8, y + 10, cardWidth, cardHeight);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, cardWidth, cardHeight);
    ctx.fillStyle = item.enabled ? lineTypeColor[item.type] : '#d9e0e4'; ctx.fillRect(x, y, cardWidth, titleHeight);
    ctx.fillStyle = 'rgba(255,255,255,.48)'; ctx.beginPath(); ctx.arc(900, y + 43, 38, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(852, y + 43, 21, 0, Math.PI * 2); ctx.fill();
    const titleX = 470; const titleWidth = 760; const layout = fitTitle(ctx, item.title, titleWidth, item.titleFontSize);
    ctx.font = `800 ${layout.size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round';
    const lineHeight = layout.size * 1.08; const firstLineY = y + titleHeight / 2 - (layout.lines.length - 1) * lineHeight / 2;
    layout.lines.forEach((line, lineIndex) => { const lineY = firstLineY + lineIndex * lineHeight; ctx.strokeText(line, titleX, lineY, titleWidth); ctx.fillStyle = '#1f2730'; ctx.fillText(line, titleX, lineY, titleWidth); });
    ctx.save(); ctx.beginPath(); ctx.rect(x + imageInset, imageY + imageInset, imageWidth, imageHeight); ctx.clip();
    if (item.enabled && images[index]) drawCover(ctx, images[index]!, x + imageInset, imageY + imageInset, imageWidth, imageHeight, item.scale, item.offsetX, item.offsetY);
    else { ctx.fillStyle = '#edf2f4'; ctx.fillRect(x + imageInset, imageY + imageInset, imageWidth, imageHeight); ctx.fillStyle = '#78909c'; ctx.font = `700 28px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.enabled ? '画像を選択してください' : 'この投稿枠は使用しません', width / 2, imageY + imageInset + imageHeight / 2); }
    ctx.restore(); ctx.strokeStyle = '#dbe6eb'; ctx.lineWidth = 2; ctx.strokeRect(x + imageInset, imageY + imageInset, imageWidth, imageHeight);
  });
}
