import { TwitterApi } from "twitter-api-v2";
export const handler = async () => {
  try {
    const cli = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!
    });
    const r = await cli.generateAuthLink(process.env.TWITTER_CALLBACK!);
    return { statusCode:200, body:JSON.stringify({ok:true,url:r.url}) };
  } catch(e:any){
    return { statusCode:500, body:JSON.stringify({ok:false,err:e.message}) };
  }
}; 