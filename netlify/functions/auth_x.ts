import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

const CALLBACK  = process.env.TWITTER_CALLBACK!;
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";

const tw = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!
});

function setCookie(name:string,val:string,maxAge=900){ // 15 min
  return `${name}=${val}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;
}

export const handler: Handler = async (evt) => {
  const qp = evt.queryStringParameters || {};
  const { oauth_token, oauth_verifier } = qp;

  console.log('🔍 OAuth Debug:', { oauth_token, oauth_verifier });
  console.log('🔍 Headers:', evt.headers);
  console.log('🔍 Cookies:', evt.headers.cookie);

  /* ---------- CALLBACK ---------- */
  if (oauth_token && oauth_verifier) {
    // cookie name = otk_<token>
    const cookieName = `otk_${oauth_token}`;
    const secret = evt.headers.cookie
      ?.split(/;\s*/).find(c=>c.startsWith(cookieName+'='))?.split('=')[1];

    console.log('🔍 Cookie search:', { cookieName, secret: secret ? 'FOUND' : 'NOT_FOUND' });

    if (!secret)
      return { statusCode: 400, body: "missing token_secret (cookie lost)" };

    try {
      console.log('🔍 Attempting OAuth exchange...');
      const { client: logged } =
        await tw.login(oauth_token, secret, oauth_verifier);
      const me = await logged.v2.me();

      console.log('🔍 OAuth successful, user:', me.data.username);

      return {
        statusCode: 302,
        headers: {
          "Set-Cookie": setCookie(cookieName,"",0),   // clear
          Location: `${FRONTPAGE}/?u=${me.data.username}`
        }
      };
    } catch (e:any){
      console.error("🔍 OAuth exchange failed:", e);
      console.error("🔍 Error details:", e?.data ?? e?.message ?? e);
      return { statusCode: 401, body: "oauth_exchange_failed" };
    }
  }

  /* ---------- STEP 0: create link ---------- */
  console.log('🔍 Generating OAuth link...');
  const { url, oauth_token: tok, oauth_token_secret: sec } =
        await tw.generateAuthLink(CALLBACK, { linkMode:"authorize" });

  console.log('🔍 Generated OAuth link:', { tok, sec: sec ? 'SECRET_GENERATED' : 'NO_SECRET' });

  const cookie = setCookie(`otk_${tok}`,sec);
  return {
    statusCode: 302,
    headers: { "Set-Cookie": cookie, Location: url }
  };
}; 