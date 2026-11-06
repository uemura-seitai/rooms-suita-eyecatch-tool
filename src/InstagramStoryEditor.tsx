import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import FixedPreview from './FixedPreview';
import StoryImagePicker from './StoryImagePicker';
import { saveSharedLibraryImage } from './utils/sharedLibrary';
import { FONT_OPTIONS } from './config/fontOptions';
import './instagram-story.css';

type Type = 'instagram_story_1' | 'instagram_story_2' | 'instagram_story_3' | 'instagram_story_4';
const base = `${import.meta.env.BASE_URL}templates/instagram/`;
const postUrl = 'https://www.instagram.com/uemura_seitai_seccotsu?cplk=dnhoaTluaDluMjhy&utm_source=qr';
const day = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).replace(/-/g, '');
const todayInJapan = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
// The date input stores its native YYYY-MM-DD value.  Parse its parts instead
// of passing the string to Date, which would treat it as UTC in some browsers.
export const formatStoryDate = (value: string) => {
  if (!value) return '';
  const [year, month, date] = value.split('-').map(Number);
  if (!year || !month || !date) return '';
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${month}/${date}(${weekdays[new Date(year, month - 1, date).getDay()]})`;
};
const defaults = (type: Type) => ({ date: type === 'instagram_story_1' ? todayInJapan() : '', am: '', pm: '', night: '', guide: '', age: type === 'instagram_story_1' ? '50代' : '', customAge: '', gender: type === 'instagram_story_1' ? '女性' : '', person: '', theme: '', question: '', one: '', two: '', stamp1: type === 'instagram_story_2' ? '🔥' : '', stamp2: type === 'instagram_story_2' ? '👏' : '' });
type StoryValues = ReturnType<typeof defaults>;
type StoryTextStyle = { size: number; family: string; color: string; weight: number; offsetX: number; offsetY: number };
type StoryTextKey = 'date' | 'am' | 'pm' | 'night' | 'guide' | 'person' | 'theme' | 'before' | 'after' | 'question' | 'one' | 'two';
// The story canvas previously used the browser's sans-serif face directly.
// Retaining it as the default keeps an untouched story pixel-equivalent.
const baseTextStyle = (size: number, color: string): StoryTextStyle => ({ size, color, family: 'sans-serif', weight: 700, offsetX: 0, offsetY: 0 });
const initialTextStyles = (): Record<StoryTextKey, StoryTextStyle> => ({ date: baseTextStyle(76, '#5f6252'), am: baseTextStyle(45, '#5f6252'), pm: baseTextStyle(45, '#5f6252'), night: baseTextStyle(45, '#5f6252'), guide: baseTextStyle(36, '#5f6252'), person: baseTextStyle(45, '#5f6252'), theme: baseTextStyle(45, '#5f6252'), before: baseTextStyle(34, '#5f6252'), after: baseTextStyle(34, '#5f6252'), question: baseTextStyle(48, '#ffffff'), one: baseTextStyle(64, '#222222'), two: baseTextStyle(64, '#222222') });
type ImageSettings = { image?: HTMLImageElement; label: string; scale: number; offsetX: number; offsetY: number };
const emptyImageSettings = (): ImageSettings => ({ label: '', scale: 1, offsetX: 0, offsetY: 0 });
const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; });
const drawText = (context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#5f6252') => { context.font = `700 ${size}px sans-serif`; context.fillStyle = color; context.textAlign = 'center'; context.textBaseline = 'middle'; const lines = value.split('\n'); lines.forEach((line, index) => context.fillText(line, x, y + (index - (lines.length - 1) / 2) * size * 1.2)); };
const drawLeftText = (context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#5f6252') => { context.font = `700 ${size}px sans-serif`; context.fillStyle = color; context.textAlign = 'left'; context.textBaseline = 'middle'; const lines = value.split('\n'); lines.forEach((line, index) => context.fillText(line, x, y + (index - (lines.length - 1) / 2) * size * 1.2)); };
const drawStyledText = (context: CanvasRenderingContext2D, value: string, x: number, y: number, style: StoryTextStyle, align: CanvasTextAlign = 'center') => { context.font = `${style.weight} ${style.size}px ${style.family}`; context.fillStyle = style.color; context.textAlign = align; context.textBaseline = 'middle'; const lines = value.split('\n'); lines.forEach((line, index) => context.fillText(line, x + style.offsetX, y + style.offsetY + (index - (lines.length - 1) / 2) * style.size * 1.2)); };
const cover = (context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, scale: number, offsetX: number, offsetY: number) => { const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale; const imageWidth = image.naturalWidth * ratio; const imageHeight = image.naturalHeight * ratio; context.save(); context.beginPath(); context.rect(x, y, width, height); context.clip(); context.drawImage(image, x + (width - imageWidth) / 2 + offsetX, y + (height - imageHeight) / 2 + offsetY, imageWidth, imageHeight); context.restore(); };
const contain = (context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) => { const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight); const imageWidth = image.naturalWidth * ratio; const imageHeight = image.naturalHeight * ratio; context.drawImage(image, x + (width - imageWidth) / 2, y + (height - imageHeight) / 2, imageWidth, imageHeight); };
const clearDatePlaceholder = (context: CanvasRenderingContext2D) => { context.save(); context.fillStyle = '#fff'; context.beginPath(); context.moveTo(235, 526); context.quadraticCurveTo(270, 475, 350, 485); context.quadraticCurveTo(540, 462, 748, 485); context.quadraticCurveTo(855, 490, 852, 545); context.quadraticCurveTo(842, 612, 748, 610); context.lineTo(325, 620); context.quadraticCurveTo(230, 605, 235, 526); context.fill(); context.fillStyle = '#E5E8DD'; context.beginPath(); context.roundRect(270, 485, 540, 100, 42); context.fill(); context.restore(); };
const videoFile = (type: Type) => `${base}instagram-story-${type.slice(-1)}-template.mp4`;
const imageArea = (type: Type) => type === 'instagram_story_3' ? { x: 185, y: 1030, width: 710, height: 410 } : { x: 140, y: 930, width: 805, height: 400 };
const mp4Mime = () => MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' : MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : '';

export default function InstagramStoryEditor({ type, onClear }: { type: Type; onClear: () => void }) {
  const [values, setValues] = useState(() => defaults(type)); const [textStyles, setTextStyles] = useState<Record<StoryTextKey, StoryTextStyle>>(initialTextStyles); const [openTextSettings, setOpenTextSettings] = useState<StoryTextKey>(); const [picked, setPicked] = useState<HTMLImageElement>(); const [label, setLabel] = useState(''); const [scale, setScale] = useState(1); const [offsetX, setOffsetX] = useState(0); const [offsetY, setOffsetY] = useState(0); const [before, setBefore] = useState<ImageSettings>(emptyImageSettings); const [after, setAfter] = useState<ImageSettings>(emptyImageSettings); const [picker, setPicker] = useState(false); const [pickerTarget, setPickerTarget] = useState<'image' | 'before' | 'after'>('image'); const [expanded, setExpanded] = useState(false); const [previewVisible, setPreviewVisible] = useState(true); const [previewKey, setPreviewKey] = useState(0); const [done, setDone] = useState(false); const [status, setStatus] = useState(''); const [rendering, setRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null); const sourceVideoRef = useRef<HTMLVideoElement>(null); const frameRef = useRef<number>(); const generationRef = useRef(0);
  const quiz = type === 'instagram_story_2'; const videoStory = type !== 'instagram_story_1';
  useEffect(() => {
    const clearPreviewState = () => {
      generationRef.current += 1;
      cancelAnimationFrame(frameRef.current || 0);
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      setValues(defaults(type)); setTextStyles(initialTextStyles()); setOpenTextSettings(undefined);
      setPicked(undefined); setLabel(''); setScale(1); setOffsetX(0); setOffsetY(0);
      setBefore(emptyImageSettings()); setAfter(emptyImageSettings()); setPicker(false); setPickerTarget('image');
      setExpanded(false); setPreviewVisible(true); setPreviewKey((current) => current + 1);
      setDone(false); setRendering(false); setStatus('');
    };
    window.addEventListener('rooms:preview-cleared', clearPreviewState);
    return () => window.removeEventListener('rooms:preview-cleared', clearPreviewState);
  }, [type]);
  useEffect(() => {
    // The vacancy controls have no empty option in the published design.
    // Keep their visual selection empty whenever their controlled value is
    // empty, rather than letting the browser display its first sample option.
    if (type !== 'instagram_story_1') return;
    document.querySelectorAll<HTMLSelectElement>('.instagram-story-card select').forEach((select) => {
      if (!select.querySelector('option[data-empty-option]')) {
        const option = document.createElement('option');
        option.value = ''; option.textContent = ''; option.dataset.emptyOption = 'true';
        select.prepend(option);
      }
      if (!select.value) select.value = '';
    });
  }, [type, values.am, values.pm, values.night]);
  useEffect(() => {
    if (type === 'instagram_story_2') setValues((current) => ({ ...current, stamp1: '🔥', stamp2: '👏' }));
  }, [type]);
  const drawReservation = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const generation = generationRef.current;
    const context = canvas.getContext('2d')!;
    canvas.width = 1080; canvas.height = 1920;
    const background = await load(`${base}instagram-story-1-template.png`);
    if (generation !== generationRef.current || canvas !== canvasRef.current) return;
    context.drawImage(background, 0, 0);

    // White panels are painted before their content so later images cannot hide the heading.
    context.fillStyle = '#fff';
    context.fillRect(155, 760, 770, 454);
    context.fillRect(155, 1248, 770, 522);
    clearDatePlaceholder(context);
    drawStyledText(context, formatStoryDate(values.date), 540, 535, textStyles.date);
    context.fillStyle = '#ffe762'; context.beginPath(); context.roundRect(180, 810, 520, 270, 25); context.fill();
    ([['午前', values.am, 'am'], ['午後', values.pm, 'pm'], ['夜間', values.night, 'night']] as const).forEach(([period, vacancy, key], index) => drawStyledText(context, `【${period}】 ${vacancy}`, 440, 865 + index * 82, textStyles[key]));
    const hasOpening = [values.am, values.pm, values.night].some((vacancy) => vacancy !== '空きなし');
    const mascot = await load(`${base}instagram-story-1-character-${hasOpening ? 'open' : 'full'}.png`);
    if (generation !== generationRef.current || canvas !== canvasRef.current) return;
    contain(context, mascot, 600, 740, 360, 400);
    drawStyledText(context, values.guide, 230, 1150, textStyles.guide, 'left');

    const personY = 1272; const imageY = 1310; const imageHeight = 380; const labelY = 1720;
    const person = `${values.age === '自由記述' ? values.customAge : values.age}${values.gender}`;
    context.font = `${textStyles.person.weight} ${textStyles.person.size}px ${textStyles.person.family}`;
    const personWidth = context.measureText(person).width;
    context.font = `${textStyles.theme.weight} ${textStyles.theme.size}px ${textStyles.theme.family}`;
    const themeWidth = context.measureText(values.theme).width;
    const gap = 45; const start = 540 - (personWidth + gap + themeWidth) / 2;
    if (before.image) cover(context, before.image, 215, imageY, 300, imageHeight, before.scale, before.offsetX, before.offsetY);
    if (after.image) cover(context, after.image, 565, imageY, 300, imageHeight, after.scale, after.offsetX, after.offsetY);
    // Draw the heading after image layers, at a distinct position above them.
    drawStyledText(context, person, start + personWidth / 2, personY, textStyles.person);
    drawStyledText(context, values.theme, start + personWidth + gap + themeWidth / 2, personY, textStyles.theme);
    drawStyledText(context, 'Before', 365, labelY, textStyles.before);
    drawStyledText(context, 'After', 715, labelY, textStyles.after);
  }, [after, before, textStyles, values]);
  const drawVideoFrame = useCallback(() => { const canvas = canvasRef.current; const video = sourceVideoRef.current; if (!canvas || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return; const context = canvas.getContext('2d')!; canvas.width = 1080; canvas.height = 1920; context.drawImage(video, 0, 0, 1080, 1920); if (quiz) { drawStyledText(context, values.question, 365, 700, textStyles.question, 'left'); drawStyledText(context, values.one, 470, 1010, textStyles.one); drawStyledText(context, values.two, 470, 1175, textStyles.two); drawText(context, values.stamp1, 825, 1010, 64); drawText(context, values.stamp2, 825, 1175, 64); } else if (picked) { const area = imageArea(type); cover(context, picked, area.x, area.y, area.width, area.height, scale, offsetX, offsetY); } }, [offsetX, offsetY, picked, quiz, scale, textStyles, type, values]);
  useEffect(() => { if (!previewVisible || videoStory) return; void drawReservation(); }, [drawReservation, previewVisible, videoStory]);
  useEffect(() => { if (!previewVisible || !videoStory) return; const video = sourceVideoRef.current; if (!video) return; const renderPreview = () => { drawVideoFrame(); frameRef.current = requestAnimationFrame(renderPreview); }; const start = () => { void video.play().catch(() => undefined); cancelAnimationFrame(frameRef.current!); renderPreview(); }; video.addEventListener('loadeddata', start); video.addEventListener('seeked', drawVideoFrame); if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) start(); return () => { video.pause(); video.removeEventListener('loadeddata', start); video.removeEventListener('seeked', drawVideoFrame); cancelAnimationFrame(frameRef.current!); }; }, [drawVideoFrame, previewVisible, videoStory, type]);
  const activatePreview = () => setPreviewVisible(true);
  const choose = async (src: string, title: string) => { const generation = generationRef.current; try { const image = await load(src); if (generation !== generationRef.current) return; activatePreview(); if (pickerTarget === 'before') setBefore({ image, label: title, scale: 1, offsetX: 0, offsetY: 0 }); else if (pickerTarget === 'after') setAfter({ image, label: title, scale: 1, offsetX: 0, offsetY: 0 }); else { setPicked(image); setLabel(title); setScale(1); setOffsetX(0); setOffsetY(0); } setPicker(false); } catch { if (generation === generationRef.current) setStatus('画像を読み込めませんでした。'); } };
  const upload = async (event: ChangeEvent<HTMLInputElement>, target: 'image' | 'before' | 'after' = 'image') => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const generation = generationRef.current; const objectUrl = URL.createObjectURL(file); try { const image = await load(objectUrl); if (generation !== generationRef.current) return; activatePreview(); if (target === 'before') setBefore({ image, label: file.name, scale: 1, offsetX: 0, offsetY: 0 }); else if (target === 'after') setAfter({ image, label: file.name, scale: 1, offsetX: 0, offsetY: 0 }); else { setPicked(image); setLabel(file.name); setScale(1); setOffsetX(0); setOffsetY(0); } } catch { if (generation === generationRef.current) setStatus('画像を読み込めませんでした。'); } finally { URL.revokeObjectURL(objectUrl); } };
  const downloadBlob = (blob: Blob, name: string) => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const pngBlob = async () => { await drawReservation(); return new Promise<Blob | null>((resolve) => canvasRef.current!.toBlob(resolve, 'image/png')); };
  const createPng = async () => { const blob = await pngBlob(); if (!blob) return; downloadBlob(blob, `instagram_story_reservation_${day()}.png`); setDone(true); };
  const sharePng = async () => { const blob = await pngBlob(); if (!blob) return; const file = new File([blob], `instagram_story_reservation_${day()}.png`, { type: 'image/png' }); if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }); else downloadBlob(blob, file.name); };
  const savePngToSharedLibrary = async () => { const blob = await pngBlob(); if (!blob) return; try { await saveSharedLibraryImage({ image: blob, title: `Instagram予約空き情報 ${day()}`, postType: 'other' }); setStatus('共有ライブラリに保存しました。'); } catch { setStatus('共有ライブラリに保存できませんでした。Macの起動状態を確認してください。'); } };
  const createVideo = async (share = false) => { const canvas = canvasRef.current; const video = sourceVideoRef.current; const mime = mp4Mime(); if (!canvas || !video) return; if (!mime) { setStatus('このブラウザはH.264 MP4を生成できません。iPhone / iPad Safariで作成してください。WebMは保存しません。'); return; } if (rendering) return; setRendering(true); setStatus('動画を作成しています。テンプレート動画の長さ分、お待ちください。'); const previewLoop = video.loop; try { await new Promise<void>((resolve, reject) => { if (video.readyState >= HTMLMediaElement.HAVE_METADATA) resolve(); else { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error()); } }); video.pause(); video.loop = false; if (video.currentTime > 0.01) { video.currentTime = 0; await new Promise<void>((resolve) => { video.onseeked = () => resolve(); }); } const chunks: BlobPart[] = []; const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 9_000_000 }); const finished = new Promise<Blob>((resolve) => { recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); }; recorder.onstop = () => resolve(new Blob(chunks, { type: mime })); }); recorder.start(); await video.play(); await new Promise<void>((resolve) => { const render = () => { drawVideoFrame(); if (video.ended) resolve(); else requestAnimationFrame(render); }; render(); }); video.pause(); recorder.stop(); const blob = await finished; const name = `instagram_story_${quiz ? 'quiz' : type === 'instagram_story_3' ? 'blog' : 'rooms'}_${day()}.mp4`; if (share) { const file = new File([blob], name, { type: mime }); if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }); else downloadBlob(blob, name); } else downloadBlob(blob, name); setDone(true); setStatus('H.264 MP4を作成しました。'); } catch { setStatus('動画を作成できませんでした。テンプレート動画を読み込んでから、もう一度お試しください。'); } finally { setRendering(false); video.loop = previewLoop; video.currentTime = 0; void video.play().catch(() => undefined); } };
  const set = (key: keyof StoryValues, value: string) => { activatePreview(); setValues({ ...values, [key]: value }); };
  const field = (title: string, key: keyof StoryValues, area = false) => {
    if (key === 'person') return <><label>年代<select value={values.age} onChange={(event) => set('age', event.target.value)}>{['10歳未満', '10代', '20代', '30代', '40代', '50代', '60代', '70代', '80代', '90代以上', '非公開', '自由記述'].map((age) => <option key={age}>{age}</option>)}</select></label>{values.age === '自由記述' && <label>自由記述<input value={values.customAge} onChange={(event) => set('customAge', event.target.value)} /></label>}<label>性別<select value={values.gender} onChange={(event) => set('gender', event.target.value)}>{['女性', '男性', '女の子', '男の子'].map((gender) => <option key={gender}>{gender}</option>)}</select></label></>;
    return <label>{title}{area ? <textarea rows={3} value={values[key]} onChange={(event) => set(key, event.target.value)} /> : <input value={values[key]} onChange={(event) => set(key, event.target.value)} />}</label>;
  };
  const mobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); const storyName = type === 'instagram_story_1' ? '予約空き時間' : type === 'instagram_story_2' ? 'クイズ動画' : type === 'instagram_story_3' ? 'ブログ更新動画' : 'ROOMs投稿動画';
  const textControls = (title: string, key: StoryTextKey) => { const style = textStyles[key]; const update = (change: Partial<StoryTextStyle>) => { activatePreview(); setTextStyles({ ...textStyles, [key]: { ...style, ...change } }); }; const open = openTextSettings === key; return <section className="story-text-settings"><button className="details" onClick={() => setOpenTextSettings(open ? undefined : key)} aria-expanded={open}>{title}の文字設定 <b>{open ? '−' : '+'}</b></button>{open && <div className="advanced text-settings"><fieldset className="text-style"><legend>{title}</legend><label>文字サイズ <output>{style.size}px</output><input type="range" min="16" max="110" value={style.size} onChange={(event) => update({ size: +event.target.value })} /></label><label>フォント<select value={style.family} onChange={(event) => update({ family: event.target.value })}>{FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>文字色<input className="color" type="color" value={style.color} onChange={(event) => update({ color: event.target.value })} /></label><label>文字の太さ<select value={style.weight} onChange={(event) => update({ weight: +event.target.value })}>{[400, 500, 600, 700, 800, 900].map((weight) => <option key={weight} value={weight}>{weight}</option>)}</select></label><div className="position-controls"><label>左右 <output>{style.offsetX > 0 ? '+' : ''}{style.offsetX}px</output><input type="range" min="-300" max="300" value={style.offsetX} onChange={(event) => update({ offsetX: +event.target.value })} /></label><label>上下 <output>{style.offsetY > 0 ? '+' : ''}{style.offsetY}px</output><input type="range" min="-300" max="300" value={style.offsetY} onChange={(event) => update({ offsetY: +event.target.value })} /></label></div></fieldset><button className="reset-text-settings" onClick={() => { activatePreview(); setTextStyles({ ...textStyles, [key]: initialTextStyles()[key] }); }}>初期設定に戻す</button></div>}</section>; };
  const imageControls = (title: string, settings: ImageSettings, update: (next: ImageSettings) => void, target: 'before' | 'after') => <section className="story-image-slot"><h3>{title}</h3><div className="line-image-actions"><button onClick={() => { setPickerTarget(target); setPicker(true); }}>共有ライブラリ・この端末から選択</button><label className="upload">画像をアップロード<input type="file" accept="image/*" onChange={(event) => void upload(event, target)} /></label></div>{settings.label && <><p className="file">選択中：{settings.label}</p><label className="image-scale-control">画像サイズ<input type="range" min=".6" max="2" step=".01" value={settings.scale} onChange={(event) => { activatePreview(); update({ ...settings, scale: +event.target.value }); }} /></label><div className="image-position-controls"><label>左右<input type="range" min="-180" max="180" value={settings.offsetX} onChange={(event) => { activatePreview(); update({ ...settings, offsetX: +event.target.value }); }} /></label><label>上下<input type="range" min="-180" max="180" value={settings.offsetY} onChange={(event) => { activatePreview(); update({ ...settings, offsetY: +event.target.value }); }} /></label></div></>}</section>;
  return <>{videoStory && <video ref={sourceVideoRef} src={videoFile(type)} muted playsInline preload="auto" loop style={{ display: 'none' }} />}<section className="card instagram-story-card"><h2><span>2</span>{storyName}設定</h2>{type === 'instagram_story_1' && <><label>日付<input type="date" value={values.date} onChange={(event) => set('date', event.target.value)} /></label>{textControls('日付', 'date')}{(['am', 'pm', 'night'] as const).map((key, index) => <section key={key}><label>{['午前', '午後', '夜間'][index]}<select value={values[key]} onChange={(event) => set(key, event.target.value)}><option>空きあり</option><option>残り少し</option><option>空きなし</option></select></label>{textControls(['午前', '午後', '夜間'][index], key)}</section>)}{field('予約案内文', 'guide', true)}{textControls('予約案内文', 'guide')}{field('年代・性別', 'person')}{textControls('年代・性別', 'person')}{field('症例テーマ', 'theme')}{textControls('症例テーマ', 'theme')}{imageControls('Before画像', before, setBefore, 'before')}{textControls('Before', 'before')}{imageControls('After画像', after, setAfter, 'after')}{textControls('After', 'after')}</>}{quiz && <>{field('問題文', 'question', true)}{textControls('問題文', 'question')}{field('選択肢①', 'one')}{textControls('選択肢①', 'one')}{field('選択肢②', 'two')}{textControls('選択肢②', 'two')}{field('スタンプ①', 'stamp1')}{field('スタンプ②', 'stamp2')}</>}{type === 'instagram_story_3' || type === 'instagram_story_4' ? <><div className="line-image-actions"><button onClick={() => { setPickerTarget('image'); setPicker(true); }}>共有ライブラリ・この端末から選択</button><label className="upload">画像をアップロード<input type="file" accept="image/*" onChange={(event) => void upload(event)} /></label></div>{label && <><p className="file">選択中：{label}</p><label className="image-scale-control">画像サイズ<input type="range" min=".6" max="2" step=".01" value={scale} onChange={(event) => setScale(+event.target.value)} /></label><div className="image-position-controls"><label>左右<input type="range" min="-180" max="180" value={offsetX} onChange={(event) => setOffsetX(+event.target.value)} /></label><label>上下<input type="range" min="-180" max="180" value={offsetY} onChange={(event) => setOffsetY(+event.target.value)} /></label></div></>}</> : null}</section><FixedPreview label={videoStory ? '動画プレビュー' : 'ストーリーズプレビュー'} expanded={expanded} onToggle={() => setExpanded(!expanded)}><canvas ref={canvasRef} aria-label="Instagramストーリーズのプレビュー" /></FixedPreview>{status && <p className="clear-status" role="status">{status}</p>}<button className="create" disabled={rendering} onClick={() => videoStory ? void createVideo() : void createPng()}>{rendering ? '動画を作成中…' : videoStory ? '動画を作成' : '画像を作成'}</button><button className="clear-inputs" onClick={() => { setValues(defaults(type)); setTextStyles(initialTextStyles()); setPicked(undefined); setLabel(''); setBefore(emptyImageSettings()); setAfter(emptyImageSettings()); setDone(false); onClear(); }}>入力内容をすべてクリア</button>{done && <section className="exports"><h2>完成しました</h2>{videoStory ? <>{mobile && <button className="photo-save" onClick={() => void createVideo(true)}>動画を保存</button>}<button className="photo-save" onClick={() => void createVideo()}>ファイルに保存</button></> : <>{mobile && <button className="photo-save" onClick={() => void sharePng()}>カメラロールに保存</button>}<button className="photo-save" onClick={() => void createPng()}>ファイルに保存</button><button className="shared-library-save" onClick={() => void savePngToSharedLibrary()}>共有ライブラリに保存</button></>}<a className="wordpress" href={postUrl} target="_blank" rel="noreferrer">Instagramに投稿</a></section>}{picker && <StoryImagePicker onPick={choose} onClose={() => setPicker(false)} />}</>;
}
