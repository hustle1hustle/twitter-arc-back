import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

const CALLBACK  = process.env.TWITTER_CALLBACK!;
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";

const tw = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!
});

function setCookie(name:string,val:string,maxAge=900){ // 15 min
  return `${name}=${val}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export const handler: Handler = async (evt) => {
  const qp = evt.queryStringParameters || {};
  const { oauth_token, oauth_verifier } = qp;

  /* ---------- CALLBACK ---------- */
  if (oauth_token && oauth_verifier) {
    // cookie name = otk_<token>
    const cookieName = `otk_${oauth_token}`;
    const secret = evt.headers.cookie
      ?.split(/;\s*/).find(c=>c.startsWith(cookieName+'='))?.split('=')[1];

    if (!secret)
      return { statusCode: 400, body: "missing token_secret (cookie lost)" };

    try {
      const { client: logged } =
        await tw.login(oauth_token, secret, oauth_verifier);
      const me = await logged.v2.me();

      return {
        statusCode: 302,
        headers: {
          "Set-Cookie": setCookie(cookieName,"",0),   // clear
          Location: `${FRONTPAGE}/?u=${me.data.username}`
        }
      };
    } catch (e:any){
      console.error("exchange failed:",e?.data ?? e);
      return { statusCode: 401, body: "oauth_exchange_failed" };
    }
  }

  /* ---------- STEP 0: create link ---------- */
  const { url, oauth_token: tok, oauth_token_secret: sec } =
        await tw.generateAuthLink(CALLBACK, { linkMode:"authorize" });

  const cookie = setCookie(`otk_${tok}`,sec);
  return {
    statusCode: 302,
    headers: { "Set-Cookie": cookie, Location: url }
  };
}; 