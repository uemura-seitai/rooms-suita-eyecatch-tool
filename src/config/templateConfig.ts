export type PostType = 'notice' | 'health';
export type Box = { x: number; y: number; width: number; height: number };
export type Template = { id: string; type: PostType; shop: string; asset: string; titleBox: Box; imageBox?: Box; title: { max: number; min: number; align: CanvasTextAlign; maxLines: number }; subtitleBox?: Box; tagsBox?: Box; labelBox?: Box; placeholderBoxes?: Box[] };
const templateAsset = (type: PostType, id: string) => `${import.meta.env.BASE_URL}templates/${type}/${id}.png`;

const noticeShops = [
  ['kokorone', 'こころね発酵ごはん'], ['takahashi', 'たかはし'], ['yamamoto', '山本ひとみ音楽教室'], ['familie', 'Familie'], ['grandir', 'grandir'], ['chamyu', 'chamyu'], ['rest', 'Rest'], ['knot', 'Knot'], ['ecc', 'ECC朝日が丘西'], ['aiko', 'aiko'], ['kstyle', 'K-STYLE'], ['chihiro', 'chihiro'], ['maki', 'Makiのおすすめレシピ'], ['uemura', 'うえむら整体院'],
] as const;
const healthShops = [['uemura', 'うえむら整体院'], ['aiko', 'aiko'], ['kstyle', 'K-STYLE'], ['maki', 'Makiのおすすめレシピ'], ['kokorone', 'こころね発酵ごはん']] as const;

export const templates: Template[] = [
  ...noticeShops.map(([id, shop]) => ({ id, shop, type: 'notice' as const, asset: templateAsset('notice', id), titleBox: { x: 60, y: 200, width: 410, height: 250 }, imageBox: { x: 500, y: 180, width: 260, height: 270 }, title: { max: 60, min: 36, align: 'center' as CanvasTextAlign, maxLines: 4 } })),
  ...healthShops.map(([id, shop]) => ({
    id, shop, type: 'health' as const, asset: templateAsset('health', id), titleBox: { x: 60, y: 175, width: 590, height: 230 }, title: { max: 72, min: 44, align: 'left' as CanvasTextAlign, maxLines: 4 },
    subtitleBox: { x: 60, y: 420, width: 610, height: 45 }, tagsBox: { x: 60, y: 530, width: 610, height: 34 },
    // These rectangles cover only the known temporary text zones. Adjust if replacement artwork changes.
    ...(id === 'kstyle' ? { labelBox: { x: 60, y: 48, width: 350, height: 54 }, placeholderBoxes: [{ x: 60, y: 48, width: 350, height: 54 }] } : {}),
    ...(id === 'kokorone' ? { labelBox: { x: 32, y: 76, width: 213, height: 75 }, placeholderBoxes: [{ x: 32, y: 76, width: 213, height: 75 }] } : {}),
  })),
];

export const getTemplates = (type: PostType) => templates.filter((item) => item.type === type);
export const getTemplate = (type: PostType, id: string) => templates.find((item) => item.type === type && item.id === id);
