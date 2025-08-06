const fetch = require('node-fetch');

const B = "https://api.tweetscout.io/v2";
const H = { ApiKey: process.env.TWEETSCOUT_KEY };

const ts = (p) => fetch(`${B}${p}`, { headers: H }).then(r => r.json());

exports.handler = async (e) => {
  console.log('λ rep invoked →', process.env.URL + '/.netlify/functions/rep');
  
  const h = (e.queryStringParameters?.u || "").replace(/^@/, "").toLowerCase();
  if (!h) return { statusCode: 400, body: "handle?" };
  
  try {
    const [info, topFollowers, score] = await Promise.all([
      ts(`/info/${h}`),
      ts(`/top-followers/${h}?from=db`),
      ts(`/score/${h}`)
    ]);
    
    if (info.error || topFollowers.error) {
      return { statusCode: 404, body: '{"error":"rep_not_built"}' };
    }
    
    const pub = info.public_metrics || {};
    const top = (topFollowers || []).slice(0, 5).map(s => `@${s.screeName}`);
    
    // Безопасный расчет возраста аккаунта
    let ageInYears = 1; // по умолчанию 1 год
    if (info.register_date) {
      try {
        ageInYears = (Date.now() - Date.parse(info.register_date)) / (3.154e10);
        if (isNaN(ageInYears) || ageInYears < 0) ageInYears = 1;
      } catch (e) {
        ageInYears = 1;
      }
    }
    
    const rep = Math.round(
      0.35 * Math.log10(Math.max(pub.followers_count || 1, 1)) * 100 +
      0.25 * (top.length / Math.max(pub.followers_count || 1, 1)) * 1000 +
      0.15 * Math.sqrt(ageInYears) * 10 +
      0.15 * (info.engagement_rate || 0) +
      0.10 * ((score.score || 0) / 10)
    );
    
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        rep,
        followers: pub.followers_count,
        smartTop: top,
        smartAvgScore: score.score || 0,
        engagementRate: info.engagement_rate,
        avgLikes: info.avg_likes,
        avgRetweets: info.avg_retweets
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 