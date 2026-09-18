export type InstagramShopConfig = { displayName: string; instagramUsername?: string };

// Add an instagramUsername when the corresponding account is confirmed.
// Keeping this separately from templates makes API-based shop resolution optional.
export const instagramShopConfig: Record<string, InstagramShopConfig> = {
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

export function resolveShopFromInstagramUsername(username?: string) {
  if (!username) return undefined;
  const normalized = username.replace(/^@/, '').toLowerCase();
  return Object.entries(instagramShopConfig).find(([, config]) => config.instagramUsername?.toLowerCase() === normalized)?.[0];
}
