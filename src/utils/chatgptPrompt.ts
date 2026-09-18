import { getShopPromptConfig } from '../config/chatgptPromptConfig';

export type PromptRequestType = 'post' | 'image';

export type PromptInput = {
  requestType: PromptRequestType;
  postType: 'notice' | 'health' | 'roomsRadio' | 'lineRich' | 'standFm' | '';
  shopId: string;
  shopName: string;
  text1: string;
  text2: string;
  subtitle: string;
  tag1: string;
  tag2: string;
  label: string;
  uploadName: string;
  additionalInstructions: string;
  textStyleSummary: string;
  instagramUrl?: string;
  instagramCaption?: string;
  instagramMediaType?: string;
};

const valueLine = (label: string, value: string) => `- ${label}: ${value.trim() || '（未入力）'}`;
const postTypeName = (type: PromptInput['postType']) => type === 'notice' ? 'お知らせ投稿' : type === 'health' ? '健康情報' : type === 'roomsRadio' ? 'ROOMsラジオ' : type === 'lineRich' ? 'LINEリッチメッセージ' : type === 'standFm' ? 'stand fm' : '（未選択）';

export function createChatGptPrompt(input: PromptInput) {
  const shopConfig = getShopPromptConfig(input.shopId);
  const shopName = shopConfig?.displayName || input.shopName || '（未選択）';
  const healthDetails = input.postType === 'health' && [input.subtitle, input.tag1, input.tag2, input.label].some((value) => value.trim())
    ? [valueLine('サブタイトル', input.subtitle), valueLine('ハッシュタグ1', input.tag1), valueLine('ハッシュタグ2', input.tag2), valueLine('上部ラベル', input.label)].join('\n')
    : '';
  const currentInfo = [
    valueLine('加盟店名', shopName), valueLine('投稿タイプ', postTypeName(input.postType)), valueLine('テキスト1', input.text1), valueLine('テキスト2', input.text2),
    valueLine('選択中の画像ファイル名', input.uploadName || '（画像未選択）'), valueLine('文字設定の概要', input.textStyleSummary), valueLine('追加の指示', input.additionalInstructions || '（なし）'),
    ...(healthDetails ? ['- 健康情報の詳細設定:', healthDetails] : []),
  ].join('\n');
  const instagramContext = input.instagramCaption ? [
    '## Instagram取得情報', valueLine('Instagram投稿URL', input.instagramUrl || ''), valueLine('加盟店', shopName), valueLine('Instagram元投稿本文', input.instagramCaption), valueLine('投稿タイプ', input.instagramMediaType || ''),
  ].join('\n') : '';

  if (input.requestType === 'post') return [
    input.instagramCaption ? '以下のInstagram投稿内容をもとに、ROOMs吹田のWordPress投稿用文章を作成してください。' : '添付した画像の内容をもとに、ROOMs吹田のWordPress投稿用文章を作成してください。',
    '画像も添付する予定です。画像に書かれていない情報は勝手に追加せず、読み取れない情報は推測しないでください。', '', '## 現在の入力情報', currentInfo,
    instagramContext, shopConfig?.postTextHint ? `\n## 加盟店ごとの補足\n${shopConfig.postTextHint}` : '', '', '## 必ず守ること',
    '- WordPressブロックエディターへ貼れる通常テキストで作成してください。', '- 見出しは ## と ### を使用してください。', '- 投稿タイトルと本文を分けて出力してください。', '- 添付画像と上記の入力内容の範囲だけを根拠にしてください。',
  ].filter(Boolean).join('\n');

  return [
    'ROOMs吹田の投稿で使用する画像を作成してください。', '加盟店の雰囲気、投稿タイプ、入力したタイトルや内容に合う画像にしてください。必要に応じて添付画像を参考にしてください。', '',
    '## 現在の入力情報', currentInfo, shopConfig?.imagePromptHint ? `\n## 加盟店ごとの補足\n${shopConfig.imagePromptHint}` : '', '', '## 依頼内容',
    '- 投稿内容に自然に合い、見やすく親しみやすい印象の画像にしてください。', '- 追加の指示がある場合は反映してください。',
  ].filter(Boolean).join('\n');
}
