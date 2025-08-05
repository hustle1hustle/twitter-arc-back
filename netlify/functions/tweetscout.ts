// ─────────────────────────────────────────────────────────────
// extra helpers for Twitter Arc v1.1
import fetch from "node-fetch";

const BASE = "https://api.tweetscout.io/b2b";
const HEAD = { "x-api-key": process.env.TWEETSCOUT_KEY! };

export const tsUser = (h) => fetch(`${BASE}/user/${h}`,            { headers: HEAD }).then(r=>r.json());
export const tsSmart = (h) => fetch(`${BASE}/smart_followers/${h}?page=1`, { headers: HEAD }).then(r=>r.json());
export const tsMeta  = (h) => fetch(`${BASE}/smart_followers/${h}/meta`,   { headers: HEAD }).then(r=>r.json()); 