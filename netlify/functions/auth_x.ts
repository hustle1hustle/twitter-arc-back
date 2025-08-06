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

  console.log('🔍 OAuth 1.0a Debug:', { oauth_token, oauth_verifier });

  /* ---------- CALLBACK ---------- */
  if (oauth_token && oauth_verifier) {
    // Get secret from cookie
    const cookies = evt.headers.cookie || '';
    const cookieName = `otk_${oauth_token}`;
    const cookieMatch = cookies.match(new RegExp(`${cookieName}=([^;]+)`));
    const secret = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

    console.log('🔍 Cookie debug:', { cookieName, hasSecret: !!secret, allCookies: cookies });

    if (!secret) {
      console.error('🔍 Missing oauth_secret in cookie');
      return { 
        statusCode: 400, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "missing oauth_secret" })
      };
    }

    try {
      console.log('🔍 Attempting OAuth exchange...');
      const { client: logged } = await tw.login(oauth_token, secret, oauth_verifier);
      const me = await logged.v2.me();

      console.log('🔍 OAuth successful, user:', me.data.username);

      return {
        statusCode: 302,
        headers: { 
          Location: `${FRONTPAGE}/?u=${me.data.username}`,
          'Set-Cookie': `${cookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None`
        }
      };
    } catch (e: any) {
      console.error("🔍 OAuth exchange failed:", e);
      console.error("🔍 Error details:", e?.data ?? e?.message ?? e);
      return { 
        statusCode: 401, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "oauth_exchange_failed" })
      };
    }
  }

  /* ---------- STEP 0: create link ---------- */
  console.log('🔍 Generating OAuth link...');
  const { url, oauth_token: tok, oauth_token_secret: sec } =
        await tw.generateAuthLink(CALLBACK, { linkMode: "authorize" });

  console.log('🔍 Generated OAuth link:', { tok, sec: sec ? 'SECRET_GENERATED' : 'NO_SECRET' });

  // Set cookie with secret
  const cookieName = `otk_${tok}`;
  const cookieValue = encodeURIComponent(sec);

  return {
    statusCode: 302,
    headers: { 
      Location: url,
      'Set-Cookie': `${cookieName}=${cookieValue}; Max-Age=900; Path=/; HttpOnly; Secure; SameSite=None`
    }
  };
}; 