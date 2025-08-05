const { TwitterApi } = require("twitter-api-v2");

const api = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
});

const CALLBACK = `https://${process.env.SITE_NAME}.netlify.app/.netlify/functions/auth_x`;

exports.handler = async (event) => {
  const { oauth_token, oauth_verifier } = event.queryStringParameters || {};

  try {
    // Step 1: Redirect user to Twitter for authorization
    if (!oauth_token) {
      const { url } = await api.generateAuthLink(CALLBACK, {
        scope: ['tweet.read']
      });
      return {
        statusCode: 302,
        headers: { Location: url }
      };
    }

    // Step 2: Handle callback and exchange tokens
    const { client } = await api.login(oauth_verifier);
    const me = await client.v1.verifyCredentials();

    return {
      statusCode: 302,
      headers: {
        Location: `https://${process.env.SITE_NAME}.netlify.app/?u=${me.screen_name}`
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
        message: error.message || 'Unknown error'
      })
    };
  }
}; 