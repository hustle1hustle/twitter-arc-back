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

    const pub   = user.public_metrics ?? {};
    const smartTop = (smart.smart_followers||[]).slice(0,5)
                     .map(s => `@${s.screen_name}`);
    const engRate = user.engagement_rate ?? 0;

    const repScore = Math.round(
        0.35*Math.log10(Math.max(pub.followers_count||1,1))*100 +
        0.25*(smartTop.length/Math.max(pub.followers_count||1,1))*1000 +
        0.15*Math.sqrt(((Date.now()-Date.parse(user.created_at))/3.154e10))*10 +
        0.15*engRate +
        0.10*((meta.avg_smart_score||0)/10)
    );

    return {
      statusCode:200,
      headers:{ "Access-Control-Allow-Origin":"*"},
      body: JSON.stringify({
        rep: repScore,
        followers: pub.followers_count,
        smartTop,
        smartMedianFollowers: meta.median_followers || 0,
        smartAvgScore: meta.avg_smart_score || 0,
        engagementRate: engRate,
        avgLikes: user.avg_likes,
        avgRetweets: user.avg_retweets,
        topHashtags: (user.top_hashtags||[]).slice(0,5).map(t=>`#${t.tag}`),
        topMentions: (user.top_mentions||[]).slice(0,5).map(t=>`@${t.tag}`),
        source:"tweetscout"
      })
    };
  } catch(e:any){
    return { statusCode:502, headers:{ "Access-Control-Allow-Origin":"*" },
             body: JSON.stringify({ error:e.message }) };
  }
}; 