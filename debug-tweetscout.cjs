const https = require('https');

async function debugTweetScout() {
  const apiKey = '3a40c7e0-66b8-4686-81eb-6bdccdbc3797';
  const handle = '0xmert_';
  
  console.log('🔍 ОТЛАДКА TWEETSCOUT API');
  console.log('='.repeat(60));
  
  const endpoints = [
    `/v2/user/${handle}`,
    `/b2b/user/${handle}`,
    `/user/${handle}`,
    `/v2/info/${handle}`,
    `/info/${handle}`
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Тестирую endpoint: ${endpoint}`);
    console.log('─'.repeat(40));
    
    const options = {
      hostname: 'api.tweetscout.io',
      path: endpoint,
      method: 'GET',
      headers: {
        'ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ УСПЕХ! Endpoint работает: ${endpoint}`);
          try {
            const json = JSON.parse(data);
            console.log('📋 Данные:', JSON.stringify(json, null, 2));
          } catch (e) {
            console.log('📋 Raw data:', data);
          }
        } else {
          console.log(`❌ ${res.statusCode}: ${data}`);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
    });

    req.end();
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

debugTweetScout(); 