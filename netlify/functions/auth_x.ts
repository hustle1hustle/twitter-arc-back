import type { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

// volatile store lives per warm lambda instance (good for 5-10 min)
const inMemorySecrets = new Map<string, string>();

const client = new TwitterApi({
  appKey:    process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!
});
const CALLBACK = process.env.TWITTER_CALLBACK!;

/* ---------- STEP 1: redirect ---------- */
export const handler: Handler = async (evt) => {
  // 1. callback comes back with oauth_token + oauth_verifier
  if (evt.queryStringParameters?.oauth_token &&
      evt.queryStringParameters?.oauth_verifier) {

    // get token & secret we stored in memory
    const reqToken = evt.queryStringParameters.oauth_token;
    const reqSecret = inMemorySecrets.get(reqToken);

    if (!reqSecret) {
      return { statusCode: 410, body: 'request token expired' };
    }

    try {
      const { client: logged, accessToken, accessSecret } =
        await client.login(reqToken, reqSecret,
                           evt.queryStringParameters.oauth_verifier);

      // SUCCESS → redirect back to front with handle
      const user = await logged.v2.me();
      return {
        statusCode: 302,
        headers: { Location: `https://rad-toffee-97e32a.netlify.app/?u=${user.data.username}` }
      };
    } catch (e:any) {
      return { statusCode: 401, body: e.message };
    }
  }

  /* ---------- STEP 0: generate auth link ---------- */
  const { url, oauth_token, oauth_token_secret } =
        await client.generateAuthLink(CALLBACK);

  inMemorySecrets.set(oauth_token, oauth_token_secret);   // <-- NEW
  return {
    statusCode: 302,
    headers: { Location: url }
  };
}; 