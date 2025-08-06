const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testTopFollowers() {
  const handle = 'sophireum';
  
  console.log('🔍 БЫСТРЫЙ ТЕСТ TOP-FOLLOWERS');
  console.log('═'.repeat(50));

  const options = {
    hostname: 'api.tweetscout.io',
    path: `/v2/top-followers/${handle}`,
    method: 'GET',
    headers: {
      'ApiKey': API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 10000 // 10 секунд таймаут
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(result, null, 2));
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

testTopFollowers(); 