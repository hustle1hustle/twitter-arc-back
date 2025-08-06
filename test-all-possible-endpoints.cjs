const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testEndpoint(baseUrl, path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tweetscout.io',
      path: `${baseUrl}${path}`,
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

async function testAllPossibleEndpoints() {
  const handle = 'sophireum';
  
  console.log('🔍 ТЕСТИРОВАНИЕ ВСЕХ ВОЗМОЖНЫХ ENDPOINTS');
  console.log('═'.repeat(80));

  const testCases = [
    // v2 API с ApiKey
    { base: '/v2', path: `/info/${handle}`, desc: 'v2 Info (ApiKey)', header: 'ApiKey' },
    { base: '/v2', path: `/user/${handle}`, desc: 'v2 User (ApiKey)', header: 'ApiKey' },
    { base: '/v2', path: `/smart_followers/${handle}`, desc: 'v2 Smart (ApiKey)', header: 'ApiKey' },
    { base: '/v2', path: `/top_followers/${handle}`, desc: 'v2 Top (ApiKey)', header: 'ApiKey' },
    { base: '/v2', path: `/score/${handle}`, desc: 'v2 Score (ApiKey)', header: 'ApiKey' },
    
    // b2b API с x-api-key
    { base: '/b2b', path: `/user/${handle}`, desc: 'b2b User (x-api-key)', header: 'x-api-key' },
    { base: '/b2b', path: `/smart_followers/${handle}`, desc: 'b2b Smart (x-api-key)', header: 'x-api-key' },
    { base: '/b2b', path: `/audience/${handle}`, desc: 'b2b Audience (x-api-key)', header: 'x-api-key' },
    
    // Попробуем разные header форматы
    { base: '/v2', path: `/info/${handle}`, desc: 'v2 Info (x-api-key)', header: 'x-api-key' },
    { base: '/v2', path: `/info/${handle}`, desc: 'v2 Info (Authorization)', header: 'Authorization' },
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Тестируем: ${testCase.desc}`);
    console.log(`   Path: ${testCase.base}${testCase.path}`);
    console.log(`   Header: ${testCase.header}`);
    
    try {
      const result = await testEndpoint(testCase.base, testCase.path, testCase.desc);
      
      console.log(`   Status: ${result.status}`);
      
      if (result.error) {
        console.log(`   ❌ Error parsing JSON: ${result.data}`);
      } else if (result.data.message === "Not Found") {
        console.log(`   ❌ Not Found`);
      } else if (result.data.error) {
        console.log(`   ❌ API Error: ${result.data.error}`);
      } else {
        console.log(`   ✅ Success`);
        
        // Показываем ключевые данные
        if (result.data.followers_count) {
          console.log(`   👥 Followers: ${result.data.followers_count}`);
        }
        if (result.data.smart_followers) {
          console.log(`   📊 Smart Followers: ${result.data.smart_followers.length}`);
        }
        if (result.data.score) {
          console.log(`   📈 Score: ${result.data.score}`);
        }
        if (result.data.public_metrics) {
          console.log(`   📊 Public Metrics: ${JSON.stringify(result.data.public_metrics)}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }
}

testAllPossibleEndpoints().catch(console.error); 