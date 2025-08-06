const fetch = require("node-fetch");

const BASE = "https://api.tweetscout.io/b2b";
const HEAD = { "x-api-key": process.env.TWEETSCOUT_KEY };

const fetchSmartMeta = async (handle) =>
  fetch(`${BASE}/smart_followers/${handle}/meta`, { headers: HEAD }).then(r => r.json());

const fetchUserEngagement = async (handle) =>
  fetch(`${BASE}/user/${handle}`, { headers: HEAD })
    .then(r => r.json())
    .then(d => ({
      likes: d.avg_likes,
      rts: d.avg_retweets,
      engagement: d.engagement_rate
    }));

const fetchAudience = async (handle) =>
  fetch(`${BASE}/user/${handle}`, { headers: HEAD })
    .then(r => r.json())
    .then(d => ({
      hashtags: (d.top_hashtags || []).slice(0, 5).map((x) => x.tag),
      mentions: (d.top_mentions || []).slice(0, 5).map((x) => x.tag)
    }));

exports.handler = async (event) => {
  const { handle, type } = event.queryStringParameters || {};
  
  if (!handle) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing handle parameter' })
    };
  }

  try {
    let result;
    switch (type) {
      case 'meta':
        result = await fetchSmartMeta(handle);
        break;
      case 'engagement':
        result = await fetchUserEngagement(handle);
        break;
      case 'audience':
        result = await fetchAudience(handle);
        break;
      default:
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid type parameter' })
        };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('TweetScout function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch data', message: error.message })
    };
  }
}; 