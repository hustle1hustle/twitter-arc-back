import { NextResponse } from 'next/server';
import { TwitterApi }   from 'twitter-api-v2';

const client = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const oauth_token     = searchParams.get('oauth_token');
  const oauth_verifier  = searchParams.get('oauth_verifier');

  // STEP-1: redirect user to Twitter
  if (!oauth_token) {
    const { url } = await client.generateAuthLink(
      process.env.TWITTER_CALLBACK!, { scope: ['tweet.read'] }
    );
    return NextResponse.redirect(url);
  }

  // STEP-2: callback → exchange tokens & get screen_name
  const { client: uClient, accessToken, accessSecret } =
        await client.login(oauth_verifier!);
  const usr = await uClient.v1.verifyCredentials();
  
  // cookie for 7 d, redirect to Bolt
  const res = NextResponse.redirect(
        `https://twitter-arc-demo.vercel.app/?u=${usr.screen_name}`);
  res.cookies.set('handle', usr.screen_name, { maxAge: 60*60*24*7 });
  res.cookies.set('at', accessToken,       { httpOnly: true });
  res.cookies.set('as', accessSecret,      { httpOnly: true });
  return res;
} 