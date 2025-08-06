const B = "https://api.tweetscout.io/v2";
const H = { ApiKey: process.env.TWEETSCOUT_KEY };

const ts = (p) => fetch(`${B}${p}`, { headers: H }).then(r => r.json());

exports.handler = async (e) => {
  console.log('λ rep-simple invoked');
  
  const h = (e.queryStringParameters?.u || "").replace(/^@/, "").toLowerCase();
  if (!h) return { statusCode: 400, body: "handle?" };
  
  console.log('📡 Fetching data for:', h);
  
  try {
    // Тестируем только основные endpoints
    const [info, topFollowers] = await Promise.all([
      ts(`/info/${h}`),
      ts(`/top-followers/${h}?from=db`)
    ]);
    
    console.log('📊 API Responses:');
    console.log('info:', JSON.stringify(info, null, 2));
    console.log('topFollowers:', JSON.stringify(topFollowers, null, 2));
    
    if (info.error || topFollowers.error) {
      return { statusCode: 404, body: '{"error":"api_error"}' };
    }
    
    const pub = info.public_metrics || {};
    const top = (topFollowers || []).slice(0, 5).map(s => `@${s.screeName}`);
    
    const followers = pub.followers_count || 0;
    const ageYears = info.register_date ? (Date.now() - Date.parse(info.register_date)) / (3.154e10) : 1;
    
    const rep = Math.round(
      0.35 * Math.log10(Math.max(followers, 1)) * 100 +
      0.25 * (top.length / Math.max(followers, 1)) * 1000 +
      0.15 * Math.sqrt(ageYears) * 10
    );
    
    console.log('🎯 Final REP Score:', rep);
    
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        rep,
        followers,
        smartTop: top,
        debug: {
          ageYears,
          topLength: top.length,
          hasInfo: !!info,
          hasTopFollowers: !!topFollowers
        }
      })
    };
  } catch (error) {
    console.log('❌ Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 