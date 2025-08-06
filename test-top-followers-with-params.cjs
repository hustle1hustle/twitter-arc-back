const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testTopFollowersWithParams() {
  const handle = 'sophireum';
  
  console.log('🔍 ТЕСТ TOP-FOLLOWERS С ПАРАМЕТРАМИ');
  console.log('═'.repeat(60));

  // Тестируем с параметром from=db для ускорения
  const options = {
    hostname: 'api.tweetscout.io',
    path: `/v2/top-followers/${handle}?from=db`,
    method: 'GET',
    headers: {
      'ApiKey': API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Success!');
        console.log('Response structure:', Array.isArray(result) ? `Array with ${result.length} items` : 'Not an array');
        
        if (Array.isArray(result) && result.length > 0) {
          console.log('\n📊 Первый элемент:');
          console.log(JSON.stringify(result[0], null, 2));
          
          console.log('\n📋 Все элементы:');
          result.forEach((item, index) => {
            console.log(`${index + 1}. @${item.screenName} (Score: ${item.score}, Followers: ${item.followersCount})`);
          });
        } else {
          console.log('Response:', JSON.stringify(result, null, 2));
        }
      } catch (e) {
        console.log('❌ Error parsing JSON:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Network Error:', error.message);
  });

  req.on('timeout', () => {
    console.log('❌ Timeout after 10 seconds');
    req.destroy();
  });

  req.end();
}

testTopFollowersWithParams(); 