import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

const CALLBACK  = process.env.TWITTER_CALLBACK!;
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";

const tw = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!
});

export const handler: Handler = async (evt) => {
  const qp = evt.queryStringParameters || {};
  const { oauth_token, oauth_verifier } = qp;

  console.log('🔍 Test OAuth Debug:');
  console.log('  oauth_token:', oauth_token);
  console.log('  oauth_verifier:', oauth_verifier);
  console.log('  cookies:', evt.headers.cookie);
  console.log('  all headers:', JSON.stringify(evt.headers, null, 2));

  if (oauth_token && oauth_verifier) {
    // Test cookie parsing
    const cookieName = `otk_${oauth_token}`;
    const cookies = evt.headers.cookie?.split(/;\s*/) || [];
    console.log('  cookieName to find:', cookieName);
    console.log('  all cookies:', cookies);
    
    const secret = cookies.find(c => c.startsWith(cookieName + '='))?.split('=')[1];
    console.log('  found secret:', secret ? 'YES' : 'NO');

    if (!secret) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "missing token_secret",
          cookieName,
          allCookies: cookies,
          debug: "Cookie not found"
        })
      };
    }

    try {
      console.log('  attempting OAuth exchange...');
      const { client: logged } = await tw.login(oauth_token, secret, oauth_verifier);
      const me = await logged.v2.me();
      
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          username: me.data.username,
          debug: "OAuth successful"
        })
      };
    } catch (e: any) {
      console.error('  OAuth exchange failed:', e);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "oauth_exchange_failed",
          details: e?.data || e?.message || e,
          debug: "OAuth exchange error"
        })
      };
    }
  }

  // Generate OAuth link
  try {
    console.log('  generating OAuth link...');
    const { url, oauth_token: tok, oauth_token_secret: sec } =
      await tw.generateAuthLink(CALLBACK, { linkMode: "authorize" });

    console.log('  generated:', { tok, sec: sec ? 'SECRET_OK' : 'NO_SECRET' });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oauth_url: url,
        oauth_token: tok,
        has_secret: !!sec,
        debug: "OAuth link generated"
      })
    };
  } catch (e: any) {
    console.error('  failed to generate OAuth link:', e);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "generate_failed",
        details: e?.data || e?.message || e,
        debug: "OAuth link generation error"
      })
    };
  }
}; 