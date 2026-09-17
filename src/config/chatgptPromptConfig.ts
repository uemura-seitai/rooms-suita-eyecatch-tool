export type ShopPromptConfig = {
  displayName: string;
  postTextHint?: string;
  imagePromptHint?: string;
};

// Add shop-specific handover notes here when they become available.
export const shopPromptConfigs: Record<string, ShopPromptConfig> = {
  kokorone: { displayName: 'こころね発酵ごはん' },
  takahashi: { displayName: 'たかはし' },
  yamamoto: { displayName: '山本ひとみ音楽教室' },
  familie: { displayName: 'Familie' },
  grandir: { displayName: 'grandir' },
  chamyu: { displayName: 'chamyu' },
  rest: { displayName: 'Rest' },
  knot: { displayName: 'Knot' },
  ecc: { displayName: 'ECC朝日が丘西' },
  aiko: { displayName: 'aiko' },
  kstyle: { displayName: 'K-STYLE' },
  chihiro: { displayName: 'chihiro' },
  maki: { displayName: 'Makiのおすすめレシピ' },
  uemura: { displayName: 'うえむら整体院' },
};

export const getShopPromptConfig = (shopId: string) => shopPromptConfigs[shopId];
