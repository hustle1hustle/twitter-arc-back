import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";
import crypto from "crypto";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const CALLBACK = process.env.TWITTER_CALLBACK!;
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";

// In-memory storage for PKCE state (в продакшене лучше использовать Redis/DB)
const pkceStates = new Map<string, { codeVerifier: string; timestamp: number }>();

export const handler: Handler = async (evt) => {
  const qp = evt.queryStringParameters || {};
  const { code, state: stateParam } = qp;

  console.log('🔍 OAuth 2.0 Debug:', { code: !!code, state: !!stateParam });

  /* ---------- CALLBACK ---------- */
  if (code && stateParam) {
    // Get PKCE state from memory
    const pkceState = pkceStates.get(stateParam);
    if (!pkceState || (Date.now() - pkceState.timestamp) > 15 * 60 * 1000) {
      console.error('🔍 Invalid or expired PKCE state');
      const errorResponse = {
        statusCode: 400 as const,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "invalid_state" })
      };
      return errorResponse;
    }

    // Clean up used state
    pkceStates.delete(stateParam);

    try {
      console.log('🔍 Exchanging code for access token...');
      
      // Exchange code for access token
      const client = new TwitterApi({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      });

      const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
        code,
        codeVerifier: pkceState.codeVerifier,
        redirectUri: CALLBACK,
      });

      console.log('🔍 OAuth 2.0 successful, got access token');

      // Get user info
      const userClient = new TwitterApi(accessToken);
      const me = await userClient.v2.me();

      console.log('🔍 User info:', me.data.username);

      return {
        statusCode: 302,
        headers: { 
          Location: `${FRONTPAGE}/?u=${me.data.username}`,
          'Set-Cookie': `twitter_token=${accessToken}; Max-Age=${expiresIn}; Path=/; HttpOnly; Secure; SameSite=None`
        }
      };
    } catch (e: any) {
      console.error("🔍 OAuth 2.0 exchange failed:", e);
      console.error("🔍 Error details:", e?.data ?? e?.message ?? e);
      return { 
        statusCode: 401, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "oauth_exchange_failed" })
      };
    }
  }

  /* ---------- STEP 0: Generate OAuth 2.0 URL ---------- */
  console.log('🔍 Generating OAuth 2.0 URL...');
  
  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  // Store PKCE state
  pkceStates.set(state, { codeVerifier, timestamp: Date.now() });

  // Clean up old states
  const now = Date.now();
  for (const [key, data] of pkceStates.entries()) {
    if (now - data.timestamp > 15 * 60 * 1000) {
      pkceStates.delete(key);
    }
  }

  // Generate OAuth 2.0 URL
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', CALLBACK);
  authUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  console.log('🔍 Generated OAuth 2.0 URL with PKCE');

  return {
    statusCode: 302,
    headers: { Location: authUrl.toString() }
  };
}; 