import { Handler } from "@netlify/functions";
import { ts } from "./tweetscout";
export const handler: Handler = async (e)=>{
 const h=(e.queryStringParameters?.u||"").replace(/^@/,"").toLowerCase();
 if(!h) return{statusCode:400,body:"handle?"};
 const [info,topFollowers,meta,grow,aud,blue]=await Promise.all([
   ts(`/info/${h}`), ts(`/top-followers/${h}?from=db`),
   ts(`/smart_followers/${h}/meta`), ts(`/followers/growth/${h}?days=30`),
   ts(`/audience/${h}`), ts(`/verification/blue/${h}`)
 ]);
 if(info.error||topFollowers.error) return{statusCode:502,body:'{"error":"ts_unavailable"}'};
 const pub=info.public_metrics||{}, top=(topFollowers||[]).slice(0,5)
 .map(s=>`@${s.screeName}`); // Исправлено: screeName вместо screenName
 const rep=Math.round(
   0.35*Math.log10(Math.max(pub.followers_count||1))*100+
   0.25*(top.length/Math.max(pub.followers_count||1))*1000+
   0.15*Math.sqrt((Date.now()-Date.parse(info.created_at))/3.154e10)*10+
   0.15*(info.engagement_rate||0)+0.10*((meta.avg_smart_score||0)/10)
 );
 return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*"},
   body:JSON.stringify({rep,followers:pub.followers_count,smartTop:top,
     smartMedianFollowers:meta.median_followers,smartAvgScore:meta.avg_smart_score,
     engagementRate:info.engagement_rate,avgLikes:info.avg_likes,avgRetweets:info.avg_retweets,
     topHashtags:(aud.top_hashtags||[]).slice(0,3).map(t=>`#${t.tag}`),
     topMentions:(aud.top_mentions||[]).slice(0,3).map(t=>`@${t.tag}`),
     bluePct:blue.blue_pct,momentum30d:grow.growth_last_30d})};
}; 