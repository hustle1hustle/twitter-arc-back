import type { Handler } from "@netlify/functions";
import crypto from "crypto";

const APP_KEY = process.env.TWITTER_API_KEY!;
const APP_SECRET = process.env.TWITTER_API_SECRET!;
const CALLBACK = process.env.TWITTER_CALLBACK!;
const FRONTPAGE = "https://rad-toffee-97e32a.netlify.app";

// In-memory storage
const oauthSecrets = new Map<string, { secret: string; timestamp: number }>();

function generateOAuthSignature(method: string, url: string, params: Record<string, string>, tokenSecret: string = '') {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${encodeURIComponent(APP_SECRET)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  return signature;
}

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
      console.log('🔍 Exchanging for access token...');
      
      const params = {
        oauth_consumer_key: APP_KEY,
        oauth_token: oauth_token,
        oauth_verifier: oauth_verifier,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_version: '1.0'
      };

      const signature = generateOAuthSignature('POST', 'https://api.twitter.com/oauth/access_token', params, stored.secret);
      params.oauth_signature = signature;

      const authHeader = 'OAuth ' + Object.keys(params)
        .filter(key => key.startsWith('oauth_'))
        .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
        .join(', ');

      // Make request to Twitter
      const postData = new URLSearchParams({
        oauth_token: oauth_token,
        oauth_verifier: oauth_verifier
      }).toString();

      const response = await fetch('https://api.twitter.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: postData
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const responseText = await response.text();
      const responseParams = new URLSearchParams(responseText);
      
      const accessToken = responseParams.get('oauth_token');
      const accessTokenSecret = responseParams.get('oauth_token_secret');
      const screenName = responseParams.get('screen_name');

      console.log('🔍 OAuth successful, user:', screenName);

      return {
        statusCode: 302,
        headers: { Location: `${FRONTPAGE}/?u=${screenName}` }
      };
    } catch (e: any) {
      console.error("🔍 OAuth exchange failed:", e);
      return { 
        statusCode: 401, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "oauth_exchange_failed" })
      };
    }
  }

  /* ---------- STEP 0: create link ---------- */
  console.log('🔍 Generating OAuth link...');
  
  const oauth_token_secret = crypto.randomBytes(32).toString('base64');
  const oauth_token_param = crypto.randomBytes(32).toString('base64');
  
  const params = {
    oauth_consumer_key: APP_KEY,
    oauth_token: oauth_token_param,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
    oauth_callback: CALLBACK
  };

  const signature = generateOAuthSignature('POST', 'https://api.twitter.com/oauth/request_token', params, oauth_token_secret);
  params.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(params)
    .filter(key => key.startsWith('oauth_'))
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
    .join(', ');

  try {
    const response = await fetch('https://api.twitter.com/oauth/request_token', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `oauth_callback=${encodeURIComponent(CALLBACK)}`
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);
    
    const requestToken = responseParams.get('oauth_token');
    const requestTokenSecret = responseParams.get('oauth_token_secret');

    console.log('🔍 Generated OAuth link:', { requestToken, hasSecret: !!requestTokenSecret });

    // Store in memory
    oauthSecrets.set(requestToken!, { secret: requestTokenSecret!, timestamp: Date.now() });

    // Clean up old entries
    const now = Date.now();
    for (const [token, data] of oauthSecrets.entries()) {
      if (now - data.timestamp > 15 * 60 * 1000) {
        oauthSecrets.delete(token);
      }
    }

    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`;

    return {
      statusCode: 302,
      headers: { Location: authUrl }
    };
  } catch (e: any) {
    console.error("🔍 Failed to generate OAuth link:", e);
    return { 
      statusCode: 500, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "failed_to_generate_link" })
    };
  }
}; 