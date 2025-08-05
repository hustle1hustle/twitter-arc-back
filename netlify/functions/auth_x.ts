import { Handler } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";

const api = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
});

export const handler: Handler = async (e) => {
  const { oauth_token, oauth_verifier } = e.queryStringParameters || {};

  try {
    // Step 1: Redirect user to Twitter for authorization
    if (!oauth_token) {
      const { url } = await api.generateAuthLink(process.env.TWITTER_CALLBACK!, {
        scope: ['tweet.read']
      });
      return {
        statusCode: 302,
        headers: { Location: url }
      };
    }

    // Step 2: Handle callback and exchange tokens
    const { client } = await api.login(oauth_verifier!);
    const me = await client.v1.verifyCredentials();

    return {
      statusCode: 302,
      headers: {
        Location: `https://rad-toffee-97e32a.netlify.app/?u=${me.screen_name}`
      }
    };
  } catch (error) {
    console.error('OAuth function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 