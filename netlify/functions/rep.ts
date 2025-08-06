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
  
  // TweetScout API calls
  const [info,topFollowersData,scoreData]=await Promise.all([
    ts(`/info/${h}`), 
    ts(`/top-followers/${h}?from=db`),
    ts(`/score/${h}`)
  ]);
  
  console.log('TweetScout info →', info);
  console.log('TweetScout topFollowers →', topFollowersData);
  console.log('TweetScout score →', scoreData);
  
  console.log('📊 API Responses:');
  console.log('info:', JSON.stringify(info, null, 2));
  console.log('topFollowers:', JSON.stringify(topFollowersData, null, 2));
  console.log('score:', JSON.stringify(scoreData, null, 2));
  
  if(info.error||topFollowersData.error) return { statusCode: 404, body: '{"error":"rep_not_built"}' };
  
  // Исправляем парсинг данных - используем правильные поля
  const followers = safe(info.followers_count); // Прямое поле, не public_metrics
  const smartTop = (topFollowersData || []).slice(0,5)
    .map(s => `@${s.screeName}`); // Используем screeName как в API
  
  // Возраст аккаунта в годах
  const createdDate = new Date(info.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);
  
  // Используем данные из score endpoint
  const smartAvg = scoreData.score || 0;
  const smartMed = safe(scoreData.median_followers || 0);
  
  // ---------- SMART MEDIAN & AVG SCORE
  const flw = topFollowersData || [];
  const smartMedianFollowers = flw.length ? flw.map(f => f.followersCount).sort((a, b) => a - b)[~~(flw.length / 2)] : 0;
  const smartAvgScore = flw.length ? flw.reduce((s, f) => s + f.score, 0) / flw.length : 0;

  console.log('🧮 Calculated values:');
  console.log('followers:', followers);
  console.log('ageYears:', ageYears);
  console.log('smartMed:', smartMed);
  console.log('smartAvg:', smartAvg);
  console.log('smartMedianFollowers:', smartMedianFollowers);
  console.log('smartAvgScore:', smartAvgScore);

  const rep = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * (smartTop.length / Math.max(followers, 1)) * 1000 +
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * 0 + // engagement rate пока 0 (нужен Twitter API)
    0.10 * (smartAvg / 10)
  );

  console.log('🎯 Final REP Score:', rep);

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      followers,
      rep,
      smartTop,
      smartMedianFollowers,
      smartAvgScore,
      engagementRate: 0, // нужен Twitter API
      avgLikes: 0, // нужен Twitter API
      avgRetweets: 0, // нужен Twitter API
      topHashtags: [], // нужен Twitter API
      topMentions: [], // нужен Twitter API
      bluePct: 0, // нужен Twitter API
      momentum30d: 0 // нужен Twitter API
    })
  };
}; 