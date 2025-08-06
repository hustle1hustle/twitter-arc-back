const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testCorrectEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tweetscout.io',
      path: `/v2${path}`,
      method: 'GET',
      headers: {
        'ApiKey': API_KEY,
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

async function testCorrectEndpoints() {
  const handle = 'sophireum';
  
  console.log('🔍 ТЕСТИРОВАНИЕ ПРАВИЛЬНЫХ ENDPOINTS');
  console.log('═'.repeat(80));

  const endpoints = [
    { path: `/info/${handle}`, desc: 'User Info' },
    { path: `/top-followers/${handle}`, desc: 'Top Followers (правильный endpoint)' },
    { path: `/score/${handle}`, desc: 'Score' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Тестируем: ${endpoint.desc}`);
    console.log(`   Path: /v2${endpoint.path}`);
    
    try {
      const result = await testCorrectEndpoint(endpoint.path, endpoint.desc);
      
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
        if (result.data.followers_count) {
          console.log(`   👥 Followers: ${result.data.followers_count}`);
        }
        if (result.data.top_followers) {
          console.log(`   📊 Top Followers: ${result.data.top_followers.length} items`);
          if (result.data.top_followers.length > 0) {
            console.log(`   📋 Первые 3: ${result.data.top_followers.slice(0,3).map(f => `@${f.screen_name}`).join(', ')}`);
          }
        }
        if (result.data.score) {
          console.log(`   📈 Score: ${result.data.score}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }
}

testCorrectEndpoints().catch(console.error); 