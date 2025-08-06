import { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";
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
  const [info,topFollowersData,scoreData,followersStats]=await Promise.all([
    ts(`/info/${h}`), 
    ts(`/top-followers/${h}?from=db`),
    ts(`/score/${h}`),
    ts(`/followers-stats?user_handle=${h}`)
  ]);
  
  console.log('TweetScout info →', info);
  console.log('TweetScout topFollowers →', topFollowersData);
  console.log('TweetScout score →', scoreData);
  console.log('TweetScout followersStats →', followersStats);
  
  console.log('📊 API Responses:');
  console.log('info:', JSON.stringify(info, null, 2));
  console.log('topFollowers:', JSON.stringify(topFollowersData, null, 2));
  console.log('score:', JSON.stringify(scoreData, null, 2));
  console.log('followersStats:', JSON.stringify(followersStats, null, 2));
  
  if(info.error||topFollowersData.error) return { statusCode: 404, body: '{"error":"rep_not_built"}' };
  
  // Twitter API calls
  let engagementRate = 0;
  let avgLikes = 0;
  let avgRetweets = 0;
  let bluePct = 0;
  let topHashtags: string[] = [];
  let topMentions: string[] = [];
  
  try {
    const BEARER_TOKEN = process.env.BEARER_TOKEN;
    if (!BEARER_TOKEN) {
      console.log('⚠️ BEARER_TOKEN не установлен');
    } else {
      const twitterClient = new TwitterApi(BEARER_TOKEN);
      
      // Get user metrics
      const user = await twitterClient.v2.userByUsername(h, {
        'user.fields': ['public_metrics', 'verified']
      });
      
      if (user.data) {
        const metrics = user.data.public_metrics;
        const followers = metrics?.followers_count || 0;
        const tweetCount = metrics?.tweet_count || 0;
        const totalLikes = metrics?.like_count || 0;
        
        // Calculate engagement rate from user metrics
        if (followers > 0 && tweetCount > 0) {
          engagementRate = parseFloat(((totalLikes / (tweetCount * followers)) * 100).toFixed(4));
        }
        
        // Get followers for blue %
        const followers_data = await twitterClient.v2.followers(user.data.id, {
          'user.fields': ['verified_type'],
          'max_results': 100
        });
        
        if (followers_data.data && followers_data.data.length > 0) {
          const verifiedCount = followers_data.data.filter(u => u.verified_type && u.verified_type !== 'none').length;
          bluePct = parseFloat((100 * verifiedCount / followers_data.data.length).toFixed(2));
        }
        
        console.log('Twitter API данные:');
        console.log('engagementRate:', engagementRate);
        console.log('bluePct:', bluePct);
      }
    }
  } catch (error) {
    console.error('Twitter API error:', error);
  }
  
  // Исправляем парсинг данных - используем правильные поля
  const followers = safe(info.followers_count); // Прямое поле, не public_metrics
  const smartTop = (topFollowersData || []).slice(0,5)
    .map((s: any) => `@${s.screeName}`); // Используем screeName как в API
  
  // Возраст аккаунта в годах
  const createdDate = new Date(info.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);
  
  // Используем данные из score endpoint
  const smartAvg = scoreData.score || 0;
  const smartMed = safe(scoreData.median_followers || 0);
  
  // ---------- SMART MEDIAN & AVG SCORE
  const flw = topFollowersData || [];
  const smartMedianFollowers = flw.length ? flw.map((f: any) => f.followersCount).sort((a: number, b: number) => a - b)[~~(flw.length / 2)] : 0;
  const smartAvgScore = flw.length ? flw.reduce((s: number, f: any) => s + f.score, 0) / flw.length : 0;

  // ---------- SMART FOLLOWERS COUNT
  const smartFollowersCount = followersStats && !followersStats.error ? 
    (followersStats.influencers_count || 0) + 
    (followersStats.projects_count || 0) + 
    (followersStats.venture_capitals_count || 0) : 0;

  console.log('🧮 Calculated values:');
  console.log('followers:', followers);
  console.log('ageYears:', ageYears);
  console.log('smartMed:', smartMed);
  console.log('smartAvg:', smartAvg);
  console.log('smartMedianFollowers:', smartMedianFollowers);
  console.log('smartAvgScore:', smartAvgScore);
  console.log('smartFollowersCount:', smartFollowersCount);

  const rep = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * (smartTop.length / Math.max(followers, 1)) * 1000 +
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * engagementRate + // Используем Twitter API данные
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
      smartFollowersCount, // Новое поле!
      engagementRate,
      avgLikes,
      avgRetweets,
      topHashtags,
      topMentions,
      bluePct,
      momentum30d: 0
    })
  };
}; 