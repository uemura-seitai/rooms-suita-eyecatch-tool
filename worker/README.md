# ROOMs Instagram Worker

Deploy this Worker separately from GitHub Pages. It calls the official Meta Graph API only; it never scrapes Instagram HTML.

## Secrets

Set `INSTAGRAM_ACCOUNTS_JSON` with `wrangler secret put INSTAGRAM_ACCOUNTS_JSON`. Its value maps a ROOMs shop ID to `{ "username", "accessToken", "igUserId" }`. Never commit that value, `.dev.vars`, or access tokens.

Public shop ID/display-name/username placeholders live in `src/shopConfig.ts`; add confirmed usernames there and in the Worker Secret for each connected account.

Optional variables: `META_GRAPH_VERSION`, `META_GRAPH_BASE`, and `INSTAGRAM_MOCK=true` for local testing. Copy `wrangler.toml.example` to `wrangler.toml` locally before deploying.

`POST /instagram/resolve` accepts `{ "url": "https://www.instagram.com/p/.../" }`. The Worker searches at most two pages of 25 media items for each connected account, caches successful shortcode lookups for 10 minutes, and returns no credentials.
