const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tweetscout.io',
      path: path,
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

async function testAllEndpoints() {
  const handle = 'sophireum';
  
  console.log('🔍 ТЕСТИРОВАНИЕ TWEETSCOUT API ENDPOINTS');
  console.log('═'.repeat(80));

  const endpoints = [
    // v2 API endpoints
    { path: `/v2/info/${handle}`, desc: 'v2 User Info' },
    { path: `/v2/smart_followers/${handle}`, desc: 'v2 Smart Followers (без page)' },
    { path: `/v2/smart_followers/${handle}?page=1`, desc: 'v2 Smart Followers (page=1)' },
    { path: `/v2/smart_followers/${handle}/meta`, desc: 'v2 Smart Meta' },
    { path: `/v2/score/${handle}`, desc: 'v2 Score' },
    
    // Старые endpoints
    { path: `/v2/user/${handle}`, desc: 'v2 User (старый)' },
    { path: `/v2/user/${handle}/smartFollowers`, desc: 'v2 User Smart Followers (старый)' },
    { path: `/v2/user/${handle}/smartFollowers?page=1`, desc: 'v2 User Smart Followers (старый, page=1)' },
    
    // b2b endpoints
    { path: `/b2b/user/${handle}`, desc: 'b2b User' },
    { path: `/b2b/smart_followers/${handle}`, desc: 'b2b Smart Followers' },
    { path: `/b2b/smart_followers/${handle}/meta`, desc: 'b2b Smart Meta' },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Тестируем: ${endpoint.desc}`);
    console.log(`   Path: ${endpoint.path}`);
    
    try {
      const result = await testEndpoint(endpoint.path, endpoint.desc);
      
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
        if (result.data.smart_followers) {
          console.log(`   📊 Smart Followers: ${result.data.smart_followers.length} items`);
        }
        if (result.data.data) {
          console.log(`   📊 Data array: ${result.data.data.length} items`);
        }
        if (result.data.followers_count) {
          console.log(`   👥 Followers: ${result.data.followers_count}`);
        }
        if (result.data.avg_smart_score) {
          console.log(`   📈 Avg Smart Score: ${result.data.avg_smart_score}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }
}

testAllEndpoints().catch(console.error); 