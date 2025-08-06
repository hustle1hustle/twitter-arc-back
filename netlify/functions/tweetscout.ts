// ─────────────────────────────────────────────────────────────
// extra helpers for Twitter Arc v1.1
const B="https://api.tweetscout.io/v2";
const H={ ApiKey: process.env.TWEETSCOUT_KEY! };
export const ts=(p: string)=>fetch(`${B}${p}`,{headers:H}).then(r=>r.json()); 