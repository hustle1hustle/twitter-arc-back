// ─────────────────────────────────────────────────────────────
// extra helpers for Twitter Arc v1.1
import fetch from "node-fetch";

const BASE = "https://api.tweetscout.io/v2";
const HEAD = { "ApiKey": process.env.TWEETSCOUT_KEY! };

export const tsUser = (h) => fetch(`${BASE}/info/${h}`,            { headers: HEAD }).then(r=>r.json());
export const tsSmart = (h) => fetch(`${BASE}/smart_followers/${h}?page=1`, { headers: HEAD }).then(r=>r.json());
export const tsMeta  = (h) => fetch(`${BASE}/smart_followers/${h}/meta`,   { headers: HEAD }).then(r=>r.json()); 