import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

const API = "https://api.tweetscout.io/b2b";
const HEAD = { "x-api-key": process.env.TWEETSCOUT_KEY };

export const handler: Handler = async (evt) => {
  // Handle CORS preflight
  if (evt.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  const u = evt.queryStringParameters?.u;
  if (!u) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: "Need ?u parameter" })
    };
  }

  try {
    // Fetch real data from TweetScout
    const [prof, smartPage, meta, eng, aud] = await Promise.all([
      fetch(`${API}/user/${u}`, { headers: HEAD }).then(r => r.json()),
      fetch(`${API}/smart_followers/${u}?page=1`, { headers: HEAD }).then(r => r.json()),
      fetch(`${API}/smart_followers/${u}/meta`, { headers: HEAD }).then(r => r.json()),
      fetch(`${API}/user/${u}`, { headers: HEAD }).then(r => r.json()).then(d => ({
        likes: d.avg_likes,
        rts: d.avg_retweets,
        engagement: d.engagement_rate
      })),
      fetch(`${API}/user/${u}`, { headers: HEAD }).then(r => r.json()).then(d => ({
        hashtags: (d.top_hashtags || []).slice(0, 5).map((x: any) => x.tag),
        mentions: (d.top_mentions || []).slice(0, 5).map((x: any) => x.tag)
      }))
    ]);

    // Check if TweetScout returned valid data
    if (!prof || prof.error) {
      return {
        statusCode: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "tweetscout_unavailable" })
      };
    }

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
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        rep,
        followers: prof.followers,
        smartTop: smartList,
        smartMedianFollowers: smartMedian,
        engagementRate: eng.engagement,
        topHashtags: aud.hashtags,
        topMentions: aud.mentions,
        source: 'tweetscout'
      })
    };
  } catch (error) {
    console.error('Reputation function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to compute reputation',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 