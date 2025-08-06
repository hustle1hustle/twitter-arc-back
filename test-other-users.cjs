const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testUser(handle) {
  console.log(`\n🔍 ТЕСТИРУЕМ @${handle}`);
  console.log('─'.repeat(50));

  const endpoints = [
    `/v2/info/${handle}`,
    `/v2/smart_followers/${handle}?page=1`,
    `/v2/smart_followers/${handle}/meta`,
    `/v2/score/${handle}`
  ];

  for (const path of endpoints) {
    try {
      const result = await new Promise((resolve, reject) => {
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
              resolve({ status: res.statusCode, data: result });
            } catch (e) {
              resolve({ status: res.statusCode, data: data, error: true });
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      const endpointName = path.split('/').pop().split('?')[0];
      console.log(`   ${endpointName}: ${result.status === 200 ? '✅' : '❌'} ${result.status}`);

      if (result.status === 200 && !result.error) {
        if (result.data.smart_followers) {
          console.log(`      📊 Smart Followers: ${result.data.smart_followers.length}`);
        }
        if (result.data.score) {
          console.log(`      📈 Score: ${result.data.score}`);
        }
        if (result.data.avg_smart_score) {
          console.log(`      📊 Avg Smart Score: ${result.data.avg_smart_score}`);
        }
        if (result.data.median_followers) {
          console.log(`      📊 Median Followers: ${result.data.median_followers}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function testMultipleUsers() {
  console.log('🔍 ТЕСТИРОВАНИЕ РАЗНЫХ ПОЛЬЗОВАТЕЛЕЙ');
  console.log('═'.repeat(80));

  // Тестируем разных пользователей
  const users = [
    'elonmusk',      // Очень популярный
    'twitter',       // Официальный аккаунт
    'jack',          // Создатель Twitter
    'sophireum',     // Наш пользователь
    '0xmert_',       // Из предыдущих анализов
    'zeroxcholy',    // Из предыдущих анализов
    '0xwenmoon'      // Из предыдущих анализов
  ];

  for (const user of users) {
    await testUser(user);
  }
}

testMultipleUsers().catch(console.error); 