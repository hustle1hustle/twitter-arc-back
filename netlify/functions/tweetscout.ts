// ─────────────────────────────────────────────────────────────
// extra helpers for Twitter Arc v1.1
import fetch from "node-fetch";

const BASE = "https://api.tweetscout.io/v2";
const HEAD = { Authorization: `Bearer ${process.env.TWEETSCOUT_KEY}` };

export const fetchSmartMeta = async (handle: string) =>
  fetch(`${BASE}/smart_followers/${handle}/meta`, { headers: HEAD }).then(r => r.json());

export const fetchUserEngagement = async (handle: string) =>
  fetch(`${BASE}/user/${handle}`, { headers: HEAD })
    .then(r => r.json())
    .then(d => ({
      likes: d.avg_likes,
      rts: d.avg_retweets,
      engagement: d.engagement_rate
    }));

export const fetchAudience = async (handle: string) =>
  fetch(`${BASE}/user/${handle}`, { headers: HEAD })
    .then(r => r.json())
    .then(d => ({
      hashtags: (d.top_hashtags || []).slice(0, 5).map((x: any) => x.tag),
      mentions: (d.top_mentions || []).slice(0, 5).map((x: any) => x.tag)
    })); 