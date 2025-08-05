const fetch = require("node-fetch");

const API = "https://api.tweetscout.io/v2";
const HEAD = { Authorization: `Bearer ${process.env.TWEETSCOUT_KEY}` };

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://rad-toffee-97e32a.netlify.app',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  const u = event.queryStringParameters?.u;
  if (!u) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': 'https://rad-toffee-97e32a.netlify.app',
      },
      body: JSON.stringify({ error: "Need ?u parameter" })
    };
  }

  try {
    // Simple test response
    const testData = {
      rep: 1000,
      followers: 50000,
      smartTop: ['@test1', '@test2'],
      smartMedianFollowers: 1000,
      engagementRate: 5.2,
      topHashtags: ['#crypto', '#web3'],
      topMentions: ['@ethereum', '@solana'],
      source: 'test'
    };

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "https://rad-toffee-97e32a.netlify.app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testData)
    };
  } catch (error) {
    console.error('Reputation function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://rad-toffee-97e32a.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to compute reputation',
        message: error.message || 'Unknown error'
      })
    };
  }
}; 