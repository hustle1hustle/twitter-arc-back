import type { Handler } from "@netlify/functions";
import { TwitterApi }   from "twitter-api-v2";

const appKey    = process.env.TWITTER_API_KEY!;
const appSecret = process.env.TWITTER_API_SECRET!;
const CALLBACK  = process.env.TWITTER_CALLBACK!;  // exact URL in Dev Portal
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";  // where stories live

const tw = new TwitterApi({ appKey, appSecret });

export const handler: Handler = async (evt) => {
  const { oauth_token, oauth_verifier } = evt.queryStringParameters || {};

  /* ---------- STEP 1  (callback from Twitter) ---------- */
  if (oauth_token && oauth_verifier) {
    //  cookie name = rt_<token>  value = secret
    const ck = evt.headers.cookie || "";
    const m  = ck.match(new RegExp(`rt_${oauth_token}=([^;]+)`));
    const secret = m && m[1];

    if (!secret)
      return { statusCode: 400, body: "request token secret missing" };

    try {
      const { client: logged } =
        await tw.login(oauth_token, secret, oauth_verifier);
      const me = await logged.v2.me();
      //  redirect to front with ?u=username
      return {
        statusCode: 302,
        headers: { Location: `${FRONTPAGE}/?u=${me.data.username}` }
      };
    } catch (e: any) {
      console.error("OAuth exchange failed", e);
      return { statusCode: 401, body: "oauth_exchange_failed" };
    }
  }

  /* ---------- STEP 0  (generate link) ---------- */
  const { url, oauth_token: tok, oauth_token_secret: sec } =
        await tw.generateAuthLink(CALLBACK, { linkMode: "authorize" });

  //  keep secret 15 min; SameSite=None гарантирует, что вернётся в cross-site callback
  const cookie = [
    `rt_${tok}=${sec}`,
    "Max-Age=900",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=None"
  ].join("; ");

  return {
    statusCode: 302,
    headers: { "Set-Cookie": cookie, Location: url }
  };
}; 