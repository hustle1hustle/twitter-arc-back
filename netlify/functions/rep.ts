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
  
  // Используем только рабочие endpoints
  const [info,topFollowers,score]=await Promise.all([
    ts(`/info/${h}`), 
    ts(`/top-followers/${h}?from=db`),
    ts(`/score/${h}`)
  ]);
  
  console.log('TweetScout info →', info);
  console.log('TweetScout topFollowers →', topFollowers);
  console.log('TweetScout score →', score);
  
  console.log('📊 API Responses:');
  console.log('info:', JSON.stringify(info, null, 2));
  console.log('topFollowers:', JSON.stringify(topFollowers, null, 2));
  console.log('score:', JSON.stringify(score, null, 2));
  
  if(info.error||topFollowers.error) return { statusCode: 404, body: '{"error":"rep_not_built"}' };
  
  // Исправляем парсинг данных - используем правильные поля
  const followers = safe(info.followers_count); // Прямое поле, не public_metrics
  const smartTop = (topFollowers || []).slice(0,5)
    .map(s => `@${s.screeName}`); // Используем screeName как в API
  
  // Возраст аккаунта в годах
  const createdDate = new Date(info.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);
  
  // Используем данные из score endpoint - убираем safe() для score.score
  const smartAvg = score.score || 0;
  const smartMed = safe(score.median_followers || 0);

  console.log('🧮 Calculated values:');
  console.log('followers:', followers);
  console.log('ageYears:', ageYears);
  console.log('smartMed:', smartMed);
  console.log('smartAvg:', smartAvg);

  const rep = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * (smartTop.length / Math.max(followers, 1)) * 1000 +
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * 0 + // engagement rate нет в API
    0.10 * (smartAvg / 10)
  );

  console.log('🎯 Final REP Score:', rep);

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      rep,
      followers: followers || null,
      smartTop,
      smartMedianFollowers: smartMed,
      smartAvgScore: smartAvg,
      engagementRate: 0, // нет в API
      avgLikes: 0, // нет в API
      avgRetweets: 0, // нет в API
      topHashtags: [], // нет в API
      topMentions: [], // нет в API
      bluePct: 0, // нет в API
      momentum30d: 0 // нет в API
    })
  };
}; 