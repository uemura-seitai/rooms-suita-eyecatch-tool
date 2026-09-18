export type WorkerShopConfig = { displayName: string; instagramUsername?: string };

// Public account mapping only. Tokens and Instagram user IDs belong exclusively
// in INSTAGRAM_ACCOUNTS_JSON, configured as a Worker Secret.
export const workerShopConfig: Record<string, WorkerShopConfig> = {
  kokorone: { displayName: 'こころね発酵ごはん' }, takahashi: { displayName: 'たかはし' }, yamamoto: { displayName: '山本ひとみ音楽教室' }, familie: { displayName: 'Familie' }, grandir: { displayName: 'grandir' }, chamyu: { displayName: 'chamyu' }, rest: { displayName: 'Rest' }, knot: { displayName: 'Knot' }, ecc: { displayName: 'ECC朝日が丘西' }, aiko: { displayName: 'aiko' }, kstyle: { displayName: 'K-STYLE' }, chihiro: { displayName: 'chihiro' }, maki: { displayName: 'Makiのおすすめレシピ' }, uemura: { displayName: 'うえむら整体院' },
};
