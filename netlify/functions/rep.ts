import { Handler } from "@netlify/functions";
import { ts } from "./tweetscout";

// гарантирует число, иначе возвращает дефолт
const safe = (n?: number, d = 0) =>
  typeof n === "number" && !isNaN(n) ? n : d;

export const handler: Handler = async (e)=>{
  console.log('λ rep invoked →', process.env.URL + '/.netlify/functions/rep');
  
  const h=(e.queryStringParameters?.u||"").replace(/^@/,"").toLowerCase();
  if(!h) return{statusCode:400,body:"handle?"};
  
  console.log('📡 Fetching data for:', h);
  
  const [info,topFollowers,meta,grow,aud,blue]=await Promise.all([
    ts(`/info/${h}`), ts(`/top-followers/${h}?from=db`),
    ts(`/smart_followers/${h}/meta`), ts(`/followers/growth/${h}?days=30`),
    ts(`/audience/${h}`), ts(`/verification/blue/${h}`)
  ]);
  
  console.log('📊 API Responses:');
  console.log('info:', JSON.stringify(info, null, 2));
  console.log('topFollowers:', JSON.stringify(topFollowers, null, 2));
  console.log('meta:', JSON.stringify(meta, null, 2));
  console.log('grow:', JSON.stringify(grow, null, 2));
  console.log('aud:', JSON.stringify(aud, null, 2));
  console.log('blue:', JSON.stringify(blue, null, 2));
  
  if(info.error||topFollowers.error) return { statusCode: 404, body: '{"error":"rep_not_built"}' };
  const pub=info.public_metrics||{}, smartTop=(topFollowers||[]).slice(0,5)
  .map(s=>`@${s.screeName}`); // Исправлено: screeName вместо screenName

  const followers   = safe(pub.followers_count);
  const ageYears    = (Date.now() - Date.parse(info.created_at)) / 3.154e10;
  const engagement  = safe(info.engagement_rate);
  const avgLikes    = safe(info.avg_likes);
  const avgRetweets = safe(info.avg_retweets);
  const smartMed    = safe(meta.median_followers);
  const smartAvg    = safe(meta.avg_smart_score);
  const bluePct     = safe(blue.blue_pct);
  const momentum    = safe(grow.growth_last_30d);

  console.log('🧮 Calculated values:');
  console.log('followers:', followers);
  console.log('ageYears:', ageYears);
  console.log('engagement:', engagement);
  console.log('smartMed:', smartMed);
  console.log('smartAvg:', smartAvg);

  const rep = Math.round(
       0.35 * Math.log10(Math.max(followers, 1)) * 100 +
       0.25 * (smartTop.length / Math.max(followers, 1)) * 1000 +
       0.15 * Math.sqrt(ageYears) * 10 +
       0.15 * engagement +
       0.10 * (smartAvg / 10)
  );

  console.log('🎯 Final REP Score:', rep);

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      rep,
      followers,
      smartTop,
      smartMedianFollowers: smartMed,
      smartAvgScore: smartAvg,
      engagementRate: engagement,
      avgLikes,
      avgRetweets,
      topHashtags: (aud.top_hashtags || []).slice(0, 3).map(t => `#${t.tag}`),
      topMentions: (aud.top_mentions || []).slice(0, 3).map(t => `@${t.tag}`),
      bluePct,
      momentum30d: momentum
    })
  };
}; 