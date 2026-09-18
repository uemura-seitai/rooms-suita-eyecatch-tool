import type { Box, Template } from '../config/templateConfig';

const fontFamily = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, sans-serif';
export type TextStyle = { size: number; family: string; color: string; weight: 400 | 500 | 600 | 700 | 800 | 900 };
export type SpecialTextStyle = TextStyle & { offsetX: number; offsetY: number; lineColors?: [string, string, string] };
export const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; });
export function drawImageContain(ctx: CanvasRenderingContext2D, image: CanvasImageSource, box: Box) {
  const source = image as HTMLImageElement; const scale = Math.min(box.width / source.naturalWidth, box.height / source.naturalHeight); const width = source.naturalWidth * scale; const height = source.naturalHeight * scale;
  ctx.drawImage(source, box.x + (box.width - width) / 2, box.y + (box.height - height) / 2, width, height);
}
function linesFor(ctx: CanvasRenderingContext2D, text: string, width: number) {
  return text.split('\n').flatMap((part) => { const chars = [...part]; const lines: string[] = []; let line = ''; chars.forEach((char) => { if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = char; } else line += char; }); lines.push(line); return lines; });
}
export function fitTextToBox(ctx: CanvasRenderingContext2D, text: string, box: Box, maxFontSize: number, minFontSize: number, lineHeight: number, maxLines: number, alignment: CanvasTextAlign) {
  for (let size = maxFontSize; size >= minFontSize; size -= 2) { ctx.font = `700 ${size}px ${fontFamily}`; const lines = linesFor(ctx, text, box.width); if (lines.length <= maxLines && lines.length * size * lineHeight <= box.height) return { size, lines }; }
  ctx.font = `700 ${minFontSize}px ${fontFamily}`; return { size: minFontSize, lines: linesFor(ctx, text, box.width).slice(0, maxLines), alignment };
}
function layoutText(ctx: CanvasRenderingContext2D, text: string, width: number, maxSize: number, minSize: number, maxLines: number, style: TextStyle, lineHeight = 1.25) {
  for (let size = maxSize; size >= minSize; size -= 2) { ctx.font = `${style.weight} ${size}px ${style.family || fontFamily}`; const lines = linesFor(ctx, text, width); if (lines.length <= maxLines) return { size, lines, height: lines.length * size * lineHeight, lineHeight }; }
  ctx.font = `${style.weight} ${minSize}px ${style.family || fontFamily}`; const lines = linesFor(ctx, text, width).slice(0, maxLines); return { size: minSize, lines, height: lines.length * minSize * lineHeight, lineHeight };
}
/**
 * Keep a special-template title as an array of display lines.  The selected
 * size is always tried first; it is reduced only when its width, line count or
 * height would overflow the title box.  For an accidentally entered fourth
 * hard line, relax the hard breaks and reflow the title into at most 3 lines.
 */
function layoutSpecialTitle(ctx: CanvasRenderingContext2D, text: string, box: Box, selectedSize: number, style: TextStyle, maxLines: number, lineHeight = 1.18) {
  const hardBreakText = text.replace(/\r/g, '');
  const reflowedText = hardBreakText.split('\n').filter(Boolean).join('');
  for (let size = selectedSize; size >= 24; size -= 1) {
    ctx.font = `${style.weight} ${size}px ${style.family || fontFamily}`;
    const hardBreakLines = linesFor(ctx, hardBreakText, box.width);
    const lines = hardBreakLines.length <= maxLines ? hardBreakLines : linesFor(ctx, reflowedText, box.width);
    const height = lines.length * size * lineHeight;
    if (lines.length <= maxLines && height <= box.height) return { size, lines, height, lineHeight };
  }
  // This is only reachable for unusually long titles.  Preserve all text by
  // reducing it to the smallest practical size instead of silently dropping a line.
  ctx.font = `${style.weight} 24px ${style.family || fontFamily}`;
  const lines = linesFor(ctx, reflowedText, box.width);
  return { size: 24, lines: lines.slice(0, maxLines), height: Math.min(lines.length, maxLines) * 24 * lineHeight, lineHeight };
}
function drawLines(ctx: CanvasRenderingContext2D, layout: ReturnType<typeof layoutText>, x: number, y: number, style: TextStyle, align: CanvasTextAlign) {
  ctx.font = `${style.weight} ${layout.size}px ${style.family || fontFamily}`; ctx.fillStyle = style.color; ctx.textAlign = align; ctx.textBaseline = 'top'; layout.lines.forEach((line, i) => ctx.fillText(line, x, y + i * layout.size * layout.lineHeight));
}
function drawOutlinedLines(ctx: CanvasRenderingContext2D, layout: ReturnType<typeof layoutText>, x: number, y: number, style: TextStyle, align: CanvasTextAlign) {
  ctx.font = `${style.weight} ${layout.size}px ${style.family || fontFamily}`; ctx.textAlign = align; ctx.textBaseline = 'top';
  const colors = (style as SpecialTextStyle).lineColors;
  layout.lines.forEach((line, i) => { const lineY = y + i * layout.size * layout.lineHeight; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, layout.size / 16); ctx.strokeStyle = '#eeeeee'; ctx.shadowColor = 'rgba(70,70,70,.48)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4; ctx.strokeText(line, x, lineY); ctx.shadowColor = 'transparent'; ctx.fillStyle = colors?.[i] || style.color; ctx.fillText(line, x, lineY); });
}
function drawTitleLines(ctx: CanvasRenderingContext2D, layout: ReturnType<typeof layoutText>, x: number, y: number, style: SpecialTextStyle) {
  ctx.font = `${style.weight} ${layout.size}px ${style.family || fontFamily}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  layout.lines.forEach((line, i) => { ctx.fillStyle = style.lineColors?.[i] || style.color; ctx.fillText(line, x, y + i * layout.size * layout.lineHeight); });
}
export async function render(canvas: HTMLCanvasElement, template: Template, values: { text1: string; text2: string; subtitle: string; tag1: string; tag2: string; label: string; number: string; newsText: string; showNews: boolean; text1Style: TextStyle; text2Style: TextStyle; specialStyles: { number: SpecialTextStyle; subtitle: SpecialTextStyle; title: SpecialTextStyle; news: SpecialTextStyle }; verticalOffset: number; uploaded?: HTMLImageElement }) {
  canvas.width = template.canvas.width; canvas.height = template.canvas.height; const ctx = canvas.getContext('2d')!; const bg = await loadImage(template.asset); ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  // Remove the template's hashtag placeholders before drawing only the user's tags.
  if (template.type === 'health') { ctx.save(); const band = ctx.getImageData(20, 550, 1, 1).data; ctx.fillStyle = `rgb(${band[0]},${band[1]},${band[2]})`; ctx.fillRect(0, 515, 1040, 70); (template.placeholderBoxes ?? []).forEach((b) => { const pixel = ctx.getImageData(b.x + 8, b.y + 8, 1, 1).data; ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`; ctx.fillRect(b.x, b.y, b.width, b.height); }); ctx.restore(); }
  if (template.imageBox && values.uploaded) drawImageContain(ctx, values.uploaded, template.imageBox);
  if (template.type === 'notice') {
    // The two notice texts are fitted together, then drawn from one exact centre X coordinate.
    let first = layoutText(ctx, values.text1, template.titleBox.width, values.text1Style.size, 24, 3, values.text1Style);
    let second = layoutText(ctx, values.text2, template.titleBox.width, values.text2Style.size, 24, 3, values.text2Style);
    const gap = values.text1 && values.text2 ? 18 : 0;
    for (let shrink = 0; first.height + second.height + gap > template.titleBox.height && shrink <= 68; shrink += 2) { first = layoutText(ctx, values.text1, template.titleBox.width, Math.max(24, values.text1Style.size - shrink), 24, 3, values.text1Style); second = layoutText(ctx, values.text2, template.titleBox.width, Math.max(24, values.text2Style.size - shrink), 24, 3, values.text2Style); }
    const groupHeight = first.height + second.height + gap; const groupY = template.titleBox.y + (template.titleBox.height - groupHeight) / 2 + values.verticalOffset; const centerX = template.titleBox.x + template.titleBox.width / 2;
    if (values.text1) drawLines(ctx, first, centerX, groupY, values.text1Style, 'center'); if (values.text2) drawLines(ctx, second, centerX, groupY + first.height + gap, values.text2Style, 'center');
  } else if (template.type === 'health') {
    const titleBox = values.uploaded && template.imageBox ? { ...template.titleBox, width: Math.min(template.titleBox.width, template.imageBox.x - template.titleBox.x - 24) } : template.titleBox;
    const layout = layoutText(ctx, values.text1, titleBox.width, values.text1Style.size, 24, template.title.maxLines, values.text1Style); const y = titleBox.y + (titleBox.height - layout.height) / 2 + values.verticalOffset;
    drawLines(ctx, layout, titleBox.x, y, values.text1Style, 'left');
  }
  if (template.type === 'health') { ctx.font = `500 32px ${fontFamily}`; ctx.textAlign = 'left'; if (values.subtitle && template.subtitleBox) ctx.fillText(values.subtitle, template.subtitleBox.x, template.subtitleBox.y, template.subtitleBox.width); const tags = [values.tag1, values.tag2].map((tag) => tag.trim()).filter(Boolean).map((tag) => `#${tag.replace(/^#/, '')}`).join('　　'); if (tags) { ctx.fillStyle = '#333333'; ctx.font = `700 36px ${fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tags, canvas.width / 2, 550); ctx.textBaseline = 'alphabetic'; } if (template.labelBox && values.label) { ctx.fillStyle = '#333333'; ctx.font = `700 29px ${fontFamily}`; ctx.textAlign = 'left'; ctx.fillText(values.label, template.labelBox.x, template.labelBox.y, template.labelBox.width); } }
  if (template.type === 'roomsRadio' || template.type === 'lineRich' || template.type === 'standFm') {
    // The source artwork contains a placeholder #. Remove it before drawing the episode number.
    const special = values.specialStyles;
    if (template.numberBox) {
      // The stand fm source PNG has a baked-in #. Its full visual footprint is
      // covered with a 175 × 105px grey rectangle (x: 0–175, y: 395–500),
      // leaving a 30px+ margin around the original glyph and no white patch.
      if (template.type === 'standFm') { const grey = ctx.getImageData(170, 490, 1, 1).data; ctx.fillStyle = `rgb(${grey[0]},${grey[1]},${grey[2]})`; ctx.fillRect(0, 395, 175, 105); } else { ctx.fillStyle = '#ffffff'; ctx.fillRect(template.numberBox.x, template.numberBox.y, template.numberBox.width, template.numberBox.height); }
      const episodeNumber = values.number.replace(/[^0-9]/g, '');
      ctx.fillStyle = special.number.color; ctx.font = `${special.number.weight} ${special.number.size}px ${special.number.family || fontFamily}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(template.type === 'standFm' ? episodeNumber : `#${episodeNumber}`, template.numberBox.x + special.number.offsetX, template.numberBox.y + special.number.offsetY);
    }
    if (template.type !== 'standFm' && !values.showNews && template.newsBandBox) { ctx.fillStyle = '#ffffff'; ctx.fillRect(template.newsBandBox.x, template.newsBandBox.y, template.newsBandBox.width, template.newsBandBox.height); }
    const subtitleStyle = special.subtitle;
    if (values.subtitle && template.subtitleBox) { const subtitle = layoutText(ctx, values.subtitle, template.subtitleBox.width, subtitleStyle.size, 16, 2, subtitleStyle, 1.15); drawLines(ctx, subtitle, template.subtitleBox.x + subtitleStyle.offsetX, template.subtitleBox.y + subtitleStyle.offsetY, subtitleStyle, 'left'); }
    const titleStyle = special.title;
    // The selected size is the upper bound. It is never raised back to a
    // template default after a user has selected a smaller value.
    const title = layoutSpecialTitle(ctx, values.text1, template.titleBox, titleStyle.size, titleStyle, template.title.maxLines);
    const titleY = template.titleBox.y + (template.titleBox.height - title.height) / 2;
    const titleX = template.titleBox.x + titleStyle.offsetX;
    if (template.type === 'standFm') drawTitleLines(ctx, title, titleX, titleY + titleStyle.offsetY, titleStyle); else drawOutlinedLines(ctx, title, titleX, titleY + titleStyle.offsetY, titleStyle, 'left');
    if (template.type !== 'standFm' && values.showNews && values.newsText && template.newsTextBox) { const newsStyle = special.news; const news = layoutText(ctx, values.newsText, template.newsTextBox.width, newsStyle.size, 20, 2, newsStyle, 1.1); drawLines(ctx, news, template.newsTextBox.x + newsStyle.offsetX, template.newsTextBox.y + (template.newsTextBox.height - news.height) / 2 + newsStyle.offsetY, newsStyle, 'left'); }
  }
}
