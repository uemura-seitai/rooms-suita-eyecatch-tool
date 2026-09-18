export type Env = {
  INSTAGRAM_ACCOUNTS_JSON?: string;
  INSTAGRAM_MOCK?: string;
  META_GRAPH_VERSION?: string;
  META_GRAPH_BASE?: string;
};

export type ConnectedAccount = { username: string; accessToken: string; igUserId: string };
export type GraphMedia = { id: string; caption?: string; media_type: string; media_url?: string; permalink: string; thumbnail_url?: string; timestamp?: string; username?: string; children?: { data?: GraphChild[] } };
export type GraphChild = { id: string; media_type: string; media_url?: string; thumbnail_url?: string };
export type ResolvedInstagramPost = { sourceUrl: string; normalizedUrl: string; shortcode: string; mediaType: string; username?: string; caption?: string; mediaUrl?: string; thumbnailUrl?: string; timestamp?: string; shopId: string };
