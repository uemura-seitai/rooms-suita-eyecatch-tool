export type PostType = 'notice' | 'health' | 'roomsRadio' | 'lineRich' | 'standFm';
export type Box = { x: number; y: number; width: number; height: number };
export type Template = {
  id: string; type: PostType; shop: string; asset: string; canvas: { width: number; height: number };
  titleBox: Box; imageBox?: Box; title: { max: number; min: number; align: CanvasTextAlign; maxLines: number };
  subtitleBox?: Box; tagsBox?: Box; labelBox?: Box; placeholderBoxes?: Box[];
  numberBox?: Box; newsTextBox?: Box; newsBandBox?: Box;
};
const templateAsset = (type: 'notice' | 'health', id: string) => `${import.meta.env.BASE_URL}templates/${type}/${id}.png`;
const specialAsset = (folder: string) => `${import.meta.env.BASE_URL}templates/${folder}/main.png`;

const noticeShops = [
  ['kokorone', 'こころね発酵ごはん'], ['takahashi', 'たかはし'], ['yamamoto', '山本ひとみ音楽教室'], ['familie', 'Familie'], ['grandir', 'grandir'], ['chamyu', 'chamyu'], ['rest', 'Rest'], ['knot', 'Knot'], ['ecc', 'ECC朝日が丘西'], ['aiko', 'aiko'], ['kstyle', 'K-STYLE'], ['chihiro', 'chihiro'], ['maki', 'Makiのおすすめレシピ'], ['uemura', 'うえむら整体院'],
] as const;
const healthShops = [['uemura', 'うえむら整体院'], ['aiko', 'aiko'], ['kstyle', 'K-STYLE'], ['maki', 'Makiのおすすめレシピ'], ['kokorone', 'こころね発酵ごはん']] as const;

// Keep each health template's optional image and subtitle positions independently adjustable.
const healthTemplateLayouts: Record<string, Pick<Template, 'subtitleBox' | 'imageBox'>> = {
  uemura: { subtitleBox: { x: 60, y: 392, width: 610, height: 45 }, imageBox: { x: 500, y: 185, width: 150, height: 200 } },
  aiko: { subtitleBox: { x: 60, y: 392, width: 610, height: 45 }, imageBox: { x: 540, y: 170, width: 250, height: 220 } },
  kstyle: { subtitleBox: { x: 60, y: 392, width: 610, height: 45 }, imageBox: { x: 540, y: 170, width: 250, height: 220 } },
  maki: { subtitleBox: { x: 60, y: 392, width: 610, height: 45 }, imageBox: { x: 530, y: 170, width: 220, height: 220 } },
  kokorone: { subtitleBox: { x: 60, y: 392, width: 610, height: 45 }, imageBox: { x: 520, y: 170, width: 235, height: 220 } },
};

export const templates: Template[] = [
  ...noticeShops.map(([id, shop]) => ({ id, shop, type: 'notice' as const, asset: templateAsset('notice', id), canvas: { width: 1040, height: 585 }, titleBox: { x: 60, y: 200, width: 410, height: 250 }, imageBox: { x: 500, y: 180, width: 260, height: 270 }, title: { max: 60, min: 36, align: 'center' as CanvasTextAlign, maxLines: 4 } })),
  ...healthShops.map(([id, shop]) => ({
    id, shop, type: 'health' as const, asset: templateAsset('health', id), canvas: { width: 1040, height: 585 }, titleBox: { x: 60, y: 175, width: 590, height: 230 }, title: { max: 72, min: 44, align: 'left' as CanvasTextAlign, maxLines: 4 },
    ...healthTemplateLayouts[id], tagsBox: { x: 0, y: 515, width: 1040, height: 70 },
    // These rectangles cover only the known temporary text zones. Adjust if replacement artwork changes.
    ...(id === 'kstyle' ? { labelBox: { x: 60, y: 48, width: 350, height: 54 }, placeholderBoxes: [{ x: 60, y: 48, width: 350, height: 54 }] } : {}),
    ...(id === 'kokorone' ? { labelBox: { x: 32, y: 76, width: 213, height: 75 }, placeholderBoxes: [{ x: 32, y: 76, width: 213, height: 75 }] } : {}),
  })),
  // These three layouts intentionally use separate coordinates because the source PNGs have different ratios.
  { id: 'main', shop: 'ROOMsラジオ', type: 'roomsRadio', asset: specialAsset('rooms-radio'), canvas: { width: 1040, height: 585 }, numberBox: { x: 42, y: 52, width: 84, height: 48 }, subtitleBox: { x: 62, y: 130, width: 710, height: 55 }, titleBox: { x: 55, y: 175, width: 720, height: 240 }, newsTextBox: { x: 150, y: 467, width: 850, height: 94 }, newsBandBox: { x: 0, y: 446, width: 1040, height: 139 }, title: { max: 118, min: 48, align: 'left', maxLines: 3 } },
  { id: 'main', shop: 'LINEリッチメッセージ', type: 'lineRich', asset: specialAsset('line-rich'), canvas: { width: 1040, height: 450 }, numberBox: { x: 50, y: 29, width: 66, height: 44 }, subtitleBox: { x: 82, y: 86, width: 690, height: 44 }, titleBox: { x: 60, y: 118, width: 720, height: 194 }, newsTextBox: { x: 160, y: 351, width: 825, height: 76 }, newsBandBox: { x: 0, y: 334, width: 1040, height: 116 }, title: { max: 98, min: 40, align: 'left', maxLines: 3 } },
  { id: 'main', shop: 'stand fm', type: 'standFm', asset: specialAsset('stand-fm'), canvas: { width: 520, height: 520 }, numberBox: { x: 28, y: 418, width: 115, height: 52 }, subtitleBox: { x: 205, y: 350, width: 290, height: 40 }, titleBox: { x: 180, y: 388, width: 315, height: 112 }, title: { max: 66, min: 26, align: 'left', maxLines: 3 } },
];

export const getTemplates = (type: PostType) => templates.filter((item) => item.type === type);
export const getTemplate = (type: PostType, id: string) => templates.find((item) => item.type === type && item.id === id);
