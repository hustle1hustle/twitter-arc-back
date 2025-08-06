const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testB2BEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tweetscout.io',
      path: `/b2b${path}`,
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result, description });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, description, error: true });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testB2BEndpoints() {
  const handle = 'sophireum';
  
  console.log('🔍 ТЕСТИРОВАНИЕ B2B API ENDPOINTS');
  console.log('═'.repeat(80));

  const endpoints = [
    { path: `/user/${handle}`, desc: 'User Info' },
    { path: `/smart_followers/${handle}?page=1`, desc: 'Smart Followers' },
    { path: `/smart_followers/${handle}/meta`, desc: 'Smart Meta' },
    { path: `/followers/growth/${handle}?days=30`, desc: 'Growth' },
    { path: `/audience/${handle}`, desc: 'Audience' },
    { path: `/verification/blue/${handle}`, desc: 'Blue Verification' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Тестируем: ${endpoint.desc}`);
    console.log(`   Path: /b2b${endpoint.path}`);
    
    try {
      const result = await testB2BEndpoint(endpoint.path, endpoint.desc);
      
      console.log(`   Status: ${result.status}`);
      
      if (result.error) {
        console.log(`   ❌ Error parsing JSON: ${result.data}`);
      } else if (result.data.message === "Not Found") {
        console.log(`   ❌ Not Found`);
      } else if (result.data.error) {
        console.log(`   ❌ API Error: ${result.data.error}`);
      } else {
        console.log(`   ✅ Success`);
        
        // Показываем структуру данных
        if (result.data.public_metrics) {
          console.log(`   📊 Public Metrics: ${JSON.stringify(result.data.public_metrics)}`);
        }
        if (result.data.smart_followers) {
          console.log(`   📊 Smart Followers: ${result.data.smart_followers.length} items`);
        }
        if (result.data.engagement_rate) {
          console.log(`   📈 Engagement Rate: ${result.data.engagement_rate}`);
        }
        if (result.data.avg_likes) {
          console.log(`   ❤️ Avg Likes: ${result.data.avg_likes}`);
        }
        if (result.data.avg_retweets) {
          console.log(`   🔄 Avg Retweets: ${result.data.avg_retweets}`);
        }
        if (result.data.top_hashtags) {
          console.log(`   #️⃣ Top Hashtags: ${result.data.top_hashtags.length} items`);
        }
        if (result.data.top_mentions) {
          console.log(`   @️⃣ Top Mentions: ${result.data.top_mentions.length} items`);
        }
        if (result.data.blue_pct) {
          console.log(`   🔵 Blue %: ${result.data.blue_pct}`);
        }
        if (result.data.growth_last_30d) {
          console.log(`   📈 Growth 30d: ${result.data.growth_last_30d}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }
}

testB2BEndpoints().catch(console.error); 