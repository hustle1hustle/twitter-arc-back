import type { Handler } from "@netlify/functions";
import { tsUser, tsSmart, tsMeta } from "./tweetscout";
export const handler: Handler = async (evt) => {
  const h = (evt.queryStringParameters?.u || "").replace(/^@/,"").toLowerCase();
  if (!h) return { statusCode:400, body:"handle required" };

  try {
    const [user, smart, meta] = await Promise.all([
      tsUser(h), tsSmart(h), tsMeta(h)
    ]);

    if (user.error || smart.error) throw new Error("tweetscout_unavailable");

    const followers = user.followers_count || 0;
    const smartTop = (smart.smart_followers||[]).slice(0,5)
                     .map(s => `@${s.screen_name}`);
    
    // Возраст аккаунта в годах
    const createdDate = new Date(user.register_date);
    const now = new Date();
    const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);

    const repScore = Math.round(
        0.35*Math.log10(Math.max(followers,1))*100 +
        0.25*(smartTop.length/Math.max(followers,1))*1000 +
        0.15*Math.sqrt(ageYears)*10 +
        0.15*0 + // engagement rate нет в API
        0.10*((meta.avg_smart_score||0)/10)
    );

    return {
      statusCode:200,
      headers:{ "Access-Control-Allow-Origin":"*"},
      body: JSON.stringify({
        rep: repScore,
        followers: followers,
        smartTop,
        smartMedianFollowers: meta.median_followers || 0,
        smartAvgScore: meta.avg_smart_score || 0,
        engagementRate: 0, // нет в API
        avgLikes: 0, // нет в API
        avgRetweets: 0, // нет в API
        topHashtags: [], // нет в API
        topMentions: [], // нет в API
        accountAge: ageYears.toFixed(1),
        verified: user.verified,
        tweetsCount: user.tweets_count,
        source:"tweetscout"
      })
    };
  } catch(e:any){
    return { statusCode:502, headers:{ "Access-Control-Allow-Origin":"*" },
             body: JSON.stringify({ error:e.message }) };
  }
}; 