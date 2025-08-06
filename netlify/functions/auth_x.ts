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
  const { oauth_token, oauth_verifier, oauth_secret } = qp;

  console.log('🔍 OAuth Debug:', { oauth_token, oauth_verifier, has_secret: !!oauth_secret });

  /* ---------- CALLBACK ---------- */
  if (oauth_token && oauth_verifier) {
    if (!oauth_secret) {
      console.error('🔍 Missing oauth_secret in callback');
      return { statusCode: 400, body: "missing oauth_secret" };
    }

    try {
      console.log('🔍 Attempting OAuth exchange...');
      const { client: logged } = await tw.login(oauth_token, oauth_secret, oauth_verifier);
      const me = await logged.v2.me();

      console.log('🔍 OAuth successful, user:', me.data.username);

      return {
        statusCode: 302,
        headers: { Location: `${FRONTPAGE}/?u=${me.data.username}` }
      };
    } catch (e: any) {
      console.error("🔍 OAuth exchange failed:", e);
      console.error("🔍 Error details:", e?.data ?? e?.message ?? e);
      return { statusCode: 401, body: "oauth_exchange_failed" };
    }
  }

  /* ---------- STEP 0: create link ---------- */
  console.log('🔍 Generating OAuth link...');
  const { url, oauth_token: tok, oauth_token_secret: sec } =
        await tw.generateAuthLink(CALLBACK, { linkMode: "authorize" });

  console.log('🔍 Generated OAuth link:', { tok, sec: sec ? 'SECRET_GENERATED' : 'NO_SECRET' });

  // Add secret to callback URL
  const callbackWithSecret = `${CALLBACK}?oauth_secret=${encodeURIComponent(sec)}`;

  return {
    statusCode: 302,
    headers: { Location: url }
  };
}; 