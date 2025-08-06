import { Handler } from "@netlify/functions";
import { ts } from "./tweetscout";
export const handler: Handler = async (e)=>{
 const h=(e.queryStringParameters?.u||"").replace(/^@/,"").toLowerCase();
 if(!h) return{statusCode:400,body:"handle?"};
 
 // Используем правильные endpoints согласно документации
 const [info,topFollowers,score]=await Promise.all([
   ts(`/info/${h}`),                    // основная информация
   ts(`/top-followers/${h}`),           // топ 20 подписчиков по TweetScout score
   ts(`/score/${h}`)                    // TweetScout score
 ]);
 
 if(info.error) return{statusCode:502,body:'{"error":"ts_unavailable"}'};
 
 const top=(topFollowers.top_followers||[]).slice(0,5).map(s=>`@${s.screen_name}`);
 const rep=Math.round(
   0.35*Math.log10(Math.max(info.followers_count||1))*100+
   0.25*(top.length/Math.max(info.followers_count||1))*1000+
   0.15*Math.sqrt((Date.now()-Date.parse(info.register_date))/3.154e10)*10+
   0.15*0+ // engagement rate нет в API
   0.10*((score.score||0)/10)
 );
 
 return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*"},
   body:JSON.stringify({
     rep,
     followers:info.followers_count,
     smartTop:top,
     smartMedianFollowers:0, // нет в API
     smartAvgScore:score.score||0,
     engagementRate:0, // нет в API
     avgLikes:0, // нет в API
     avgRetweets:0, // нет в API
     topHashtags:[], // нет в API
     topMentions:[], // нет в API
     bluePct:0, // нет в API
     momentum30d:0 // нет в API
   })};
}; 