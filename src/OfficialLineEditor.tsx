import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { blobToDataUrl, listLibraryImages, type LibraryImage } from './utils/imageLibrary';
import { defaultOfficialLineState, lineTypeColor, lineTypeLabel, renderOfficialLine, type OfficialLineItemType, type OfficialLineSlot, type OfficialLineState } from './utils/officialLineCanvas';
import headerNews from './assets/official-line/header-news.png';

type LibraryPreview = LibraryImage & { src: string };
type Props = { resetToken: number; onClear: () => void };

const typeForLibrary: Record<OfficialLineItemType, LibraryImage['postType']> = { radio: 'radio', health: 'health', notice: 'notice' };
const dateFilePart = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo', hour12: false }).replace(/[\s:-]/g, '').slice(0, 12);

export default function OfficialLineEditor({ resetToken, onClear }: Props) {
  const [state, setState] = useState<OfficialLineState>(defaultOfficialLineState);
  const [library, setLibrary] = useState<LibraryPreview[]>([]);
  const [libraryOpenFor, setLibraryOpenFor] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const refreshLibrary = async () => {
    try { setLibrary((await Promise.all((await listLibraryImages()).map(async (image) => ({ ...image, src: await blobToDataUrl(image.image) })))).slice(0, 30)); }
    catch { setStatus('画像ライブラリを読み込めませんでした。'); }
  };
  useEffect(() => { void refreshLibrary(); }, []);
  useEffect(() => { if (!canvasRef.current) return; void renderOfficialLine(canvasRef.current, state).catch(() => setStatus('プレビュー画像を描画できませんでした。')); }, [state]);
  useEffect(() => { if (resetToken) setState(defaultOfficialLineState()); }, [resetToken]);

  const updateSlot = (index: number, next: Partial<OfficialLineSlot>) => setState((current) => ({ ...current, slots: current.slots.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...next } : slot) }));
  const uploadImage = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { updateSlot(index, { uploadedImage: await blobToDataUrl(file), imageId: undefined }); } catch { setStatus('画像を読み込めませんでした。JPEG、PNG、WebPでお試しください。'); }
    event.target.value = '';
  };
  const pickLibrary = (index: number, image: LibraryPreview) => { updateSlot(index, { uploadedImage: image.src, imageId: image.id, type: image.postType === 'radio' || image.postType === 'health' || image.postType === 'notice' ? image.postType : state.slots[index].type }); setLibraryOpenFor(null); };
  const copyLinks = async () => {
    const text = state.slots.map((slot, index) => `投稿${index + 1}\n${slot.title}\n${slot.linkUrl}`).join('\n');
    try { await navigator.clipboard.writeText(text); } catch { const area = document.createElement('textarea'); area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
    setStatus('リンク一覧をコピーしました。');
  };
  const download = async () => {
    if (!canvasRef.current) return;
    const blob = await new Promise<Blob | null>((resolve) => canvasRef.current!.toBlob(resolve, 'image/png'));
    if (!blob) return setStatus('PNGを作成できませんでした。');
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `official-line-${dateFilePart()}.png`; anchor.click(); URL.revokeObjectURL(url); setStatus('公式LINE用PNGを作成しました。');
  };

  return <>
    <section className="card official-line-fixed-header"><h2><span>2</span> 固定ヘッダー</h2><img src={headerNews} alt="新着記事・加盟店からのお知らせ" /><p className="hint">固定ヘッダーはプレビュー・PNG出力に自動で使用されます。</p></section>
    {state.slots.map((slot, index) => <section className="card official-line-slot" key={index}>
      <h2><span>{index + 3}</span> 投稿枠{index + 1}</h2>
      <label className="toggle"><input type="checkbox" checked={slot.enabled} onChange={(e) => updateSlot(index, { enabled: e.target.checked })} /> この投稿枠を使用する</label>
      <div className="official-line-type"><label>投稿種別<select value={slot.type} onChange={(e) => updateSlot(index, { type: e.target.value as OfficialLineItemType })}>{(Object.keys(lineTypeLabel) as OfficialLineItemType[]).map((item) => <option value={item} key={item}>{lineTypeLabel[item]}</option>)}</select></label><span className="line-color-chip" style={{ background: lineTypeColor[slot.type] }}>{lineTypeLabel[slot.type]}：{slot.type === 'radio' ? 'ピンク' : slot.type === 'health' ? '水色' : '黄色'}</span></div>
      <label>見出しタイトル<input value={slot.title} onChange={(e) => updateSlot(index, { title: e.target.value })} /></label>
      <div className="line-image-actions"><button onClick={() => { setLibraryOpenFor(index); void refreshLibrary(); }}>ライブラリから画像を選択</button><label className="upload">画像をアップロード<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(index, event)} /></label></div>
      {slot.uploadedImage && <img className="line-selected-image" src={slot.uploadedImage} alt={`投稿枠${index + 1}の選択画像`} />}
      <fieldset className="line-position"><legend>画像位置調整</legend><label>拡大率 <output>{Math.round(slot.scale * 100)}%</output><input type="range" min="0.7" max="2" step="0.01" value={slot.scale} onChange={(e) => updateSlot(index, { scale: Number(e.target.value) })} /></label><label>左右 <output>{slot.offsetX > 0 ? '+' : ''}{slot.offsetX}</output><input type="range" min="-100" max="100" value={slot.offsetX} onChange={(e) => updateSlot(index, { offsetX: Number(e.target.value) })} /></label><label>上下 <output>{slot.offsetY > 0 ? '+' : ''}{slot.offsetY}</output><input type="range" min="-100" max="100" value={slot.offsetY} onChange={(e) => updateSlot(index, { offsetY: Number(e.target.value) })} /></label><button onClick={() => updateSlot(index, { scale: 1, offsetX: 0, offsetY: 0 })}>初期位置に戻す</button></fieldset>
      <label>リンクURL<input type="url" inputMode="url" value={slot.linkUrl} onChange={(e) => updateSlot(index, { linkUrl: e.target.value })} placeholder="https://" /></label>
    </section>)}
    <section className="card line-links"><h2>リンク設定用</h2><button onClick={() => void copyLinks()}>リンク一覧をコピー</button><a href="https://manager.line.biz/" target="_blank" rel="noreferrer">公式LINEを開く</a></section>
    <section className="card preview-card official-line-preview"><h2>公式LINE プレビュー</h2><canvas ref={canvasRef} aria-label="公式LINE配信用画像のプレビュー" /></section>
    {status && <p className="clear-status" role="status">{status}</p>}
    <button className="create" onClick={() => void download()}>公式LINE用画像を作成</button>
    <button className="clear-inputs" onClick={() => { setState(defaultOfficialLineState()); onClear(); }}>入力内容をすべてクリア</button>
    <button className="reset-text-settings line-reset" onClick={() => setState(defaultOfficialLineState())}>初期設定に戻す</button>
    {libraryOpenFor !== null && <div className="line-library-backdrop" role="dialog" aria-modal="true" aria-label="画像ライブラリ"><div className="line-library"><div><h2>画像ライブラリ</h2><button className="line-library-close" onClick={() => setLibraryOpenFor(null)}>閉じる</button></div>{library.length ? <div className="line-library-grid">{library.map((image) => <button key={image.id} onClick={() => pickLibrary(libraryOpenFor, image)}><img src={image.src} alt="" /><strong>{image.title || '無題の画像'}</strong><small>{lineTypeLabel[image.postType as OfficialLineItemType] || 'その他'}</small></button>)}</div> : <p className="hint">保存済み画像はありません。通常投稿の完成後に「画像ライブラリに保存」を押すとここから選べます。</p>}</div></div>}
  </>;
}
