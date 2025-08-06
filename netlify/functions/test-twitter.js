const { TwitterApi } = require('twitter-api-v2');

exports.handler = async () => {
  console.log('🧪 Testing Twitter API in Netlify');
  
  try {
    const BEARER_TOKEN = process.env.BEARER_TOKEN;
    if (!BEARER_TOKEN) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "BEARER_TOKEN not set",
          twitter_working: false
        })
      };
    }
    
    const client = new TwitterApi(BEARER_TOKEN);
    
    const user = await client.v2.userByUsername('zeroxcholy', {
      'user.fields': ['public_metrics']
    });
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        twitter_working: !!user.data,
        user_data: user.data ? {
          username: user.data.username,
          followers: user.data.public_metrics?.followers_count
        } : null
      })
    };
    
  } catch (error) {
    console.error('Twitter API error:', error.message);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error.message,
        twitter_working: false
      })
    };
  }
}; 