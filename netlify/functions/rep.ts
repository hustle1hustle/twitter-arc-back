import { Handler } from "@netlify/functions";
import fetch from "node-fetch";
import { TwitterApi } from "twitter-api-v2";
import { fetchSmartMeta, fetchUserEngagement, fetchAudience } from "./tweetscout";

const API = "https://api.tweetscout.io/v2";
const HEAD = { Authorization: `Bearer ${process.env.TWEETSCOUT_KEY}` };

// Twitter API fallback
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || '');

async function fetchProfileWithFallback(handle: string) {
  try {
    // Try TweetScout first
    const [prof, smartPage, meta, eng, aud] = await Promise.all([
      fetch(`${API}/user/${handle}`, { headers: HEAD }).then(r=>r.json()),
      fetch(`${API}/smart_followers/${handle}?page=1`, { headers: HEAD }).then(r=>r.json()),
      fetchSmartMeta(handle),
      fetchUserEngagement(handle),
      fetchAudience(handle)
    ]);
    
    return { prof, smartPage, meta, eng, aud, source: 'tweetscout' };
  } catch (error) {
    console.log('TweetScout failed, falling back to Twitter API');
    
    // Fallback to Twitter API
    const user = await twitterClient.v2.userByUsername(handle, {
      'user.fields': ['id', 'username', 'name', 'public_metrics', 'verified', 'profile_image_url', 'created_at']
    });
    
    if (!user.data) {
      throw new Error('User not found');
    }
    
    // Mock data for Twitter API fallback
    const prof = {
      followers: user.data.public_metrics?.followers_count || 0,
      created_at: user.data.created_at,
      verified: user.data.verified || false
    };
    
    const smartPage = { smart_followers: [] };
    const meta = { median_followers: 0, avg_smart_score: 0 };
    const eng = { engagement: 0 };
    const aud = { hashtags: [], mentions: [] };
    
    return { prof, smartPage, meta, eng, aud, source: 'twitter' };
  }
}

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
    const { prof, smartPage, meta, eng, aud, source } = await fetchProfileWithFallback(u);

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
        topMentions: aud.mentions,
        source // Indicate data source
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