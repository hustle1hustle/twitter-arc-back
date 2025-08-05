import { Handler } from "@netlify/functions";
import fetch from "node-fetch";
import { fetchSmartMeta, fetchUserEngagement, fetchAudience } from "./tweetscout";

const API = "https://api.tweetscout.io/v2";
const HEAD = { Authorization: `Bearer ${process.env.TWEETSCOUT_KEY}` };

export const handler: Handler = async (e) => {
  // Handle CORS preflight
  if (e.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://rad-toffee-97e32a.netlify.app',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  const u = e.queryStringParameters?.u;
  if (!u) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': 'https://rad-toffee-97e32a.netlify.app',
      },
      body: JSON.stringify({ error: "Need ?u parameter" })
    };
  }

  try {
    // fetch in parallel
    const [prof, smartPage, meta, eng, aud] = await Promise.all([
      fetch(`${API}/user/${u}`, { headers: HEAD }).then(r=>r.json()),
      fetch(`${API}/smart_followers/${u}?page=1`, { headers: HEAD }).then(r=>r.json()),
      fetchSmartMeta(u),
      fetchUserEngagement(u),
      fetchAudience(u)
    ]);

    const smartList = smartPage.smart_followers?.slice(0,5).map((s:any)=>s.screen_name) || [];
    const smartMedian = meta.median_followers || 0;
    const age = Math.floor((Date.now()-Date.parse(prof.created_at))/3.154e10);

    const rep = Math.round(
        0.35*Math.log10(Math.max(prof.followers,1))*100 +
        0.25*(smartList.length/Math.max(prof.followers,1))*100 +
        0.15*Math.sqrt(age)*10 +
        0.15*(eng.engagement||0) +
        0.10*((meta.avg_smart_score||0)/100*10)
    );

    return {
      statusCode:200,
      headers:{ "Access-Control-Allow-Origin":"https://rad-toffee-97e32a.netlify.app" },
      body: JSON.stringify({
        rep,
        followers: prof.followers,
        smartTop: smartList,
        smartMedianFollowers: smartMedian,
        engagementRate: eng.engagement,
        topHashtags: aud.hashtags,
        topMentions: aud.mentions
      })
    };
  } catch (error) {
    console.error('Reputation function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://rad-toffee-97e32a.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to compute reputation',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 