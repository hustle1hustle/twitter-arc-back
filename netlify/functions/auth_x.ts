import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

const CALLBACK  = process.env.TWITTER_CALLBACK!;
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";

const tw = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!
});

// In-memory storage
const oauthSecrets = new Map<string, { secret: string; timestamp: number }>();

export const handler: Handler = async (evt) => {
  const qp = evt.queryStringParameters || {};
  const { oauth_token, oauth_verifier } = qp;

  console.log('🔍 OAuth 1.0a Debug:', { oauth_token, oauth_verifier });

  /* ---------- CALLBACK ---------- */
  if (oauth_token && oauth_verifier) {
    // Get secret from memory
    const stored = oauthSecrets.get(oauth_token);
    if (!stored || (Date.now() - stored.timestamp) > 15 * 60 * 1000) {
      console.error('🔍 Missing or expired oauth_token_secret');
      return { 
        statusCode: 400, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "missing_token_secret" })
      };
    }

    // Clean up used secret
    oauthSecrets.delete(oauth_token);

    try {
      console.log('🔍 Attempting OAuth exchange...');
      const { client: logged } = await tw.login(oauth_token, stored.secret, oauth_verifier);
      const me = await logged.v2.me();

      console.log('🔍 OAuth successful, user:', me.data.username);

      return {
        statusCode: 302,
        headers: { Location: `${FRONTPAGE}/?u=${me.data.username}` }
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

  // Store in memory
  oauthSecrets.set(tok, { secret: sec, timestamp: Date.now() });

  // Clean up old entries
  const now = Date.now();
  for (const [token, data] of oauthSecrets.entries()) {
    if (now - data.timestamp > 15 * 60 * 1000) {
      oauthSecrets.delete(token);
    }
  }

  return {
    statusCode: 302,
    headers: { Location: url }
  };
}; 