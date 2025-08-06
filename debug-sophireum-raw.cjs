const https = require('https');

const BASE = "https://api.tweetscout.io/v2";
const HEAD = { "ApiKey": "3a40c7e0-66b8-4686-81eb-6bdccdbc3797" };

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tweetscout.io',
      path: `/v2${path}`,
      method: 'GET',
      headers: {
        'ApiKey': HEAD.ApiKey,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

const tsUser = (h) => makeRequest(`/info/${h}`);
const tsSmart = (h) => makeRequest(`/smart_followers/${h}?page=1`);
const tsMeta = (h) => makeRequest(`/smart_followers/${h}/meta`);

async function debugSophireum() {
  const handle = 'sophireum';
  
  console.log('🔍 ОТЛАДКА СЫРЫХ ДАННЫХ @sophireum');
  console.log('═'.repeat(80));

  try {
    console.log('\n📊 tsUser() - Информация о пользователе:');
    console.log('─'.repeat(50));
    const user = await tsUser(handle);
    console.log(JSON.stringify(user, null, 2));

    console.log('\n📊 tsSmart() - Умные подписчики:');
    console.log('─'.repeat(50));
    const smart = await tsSmart(handle);
    console.log(JSON.stringify(smart, null, 2));

    console.log('\n📊 tsMeta() - Метаданные умных подписчиков:');
    console.log('─'.repeat(50));
    const meta = await tsMeta(handle);
    console.log(JSON.stringify(meta, null, 2));

    console.log('\n🔍 АНАЛИЗ СТРУКТУРЫ ДАННЫХ:');
    console.log('─'.repeat(50));
    
    // Анализ user
    console.log('📝 User структура:');
    console.log(`  - followers_count: ${user.followers_count} (тип: ${typeof user.followers_count})`);
    console.log(`  - tweets_count: ${user.tweets_count} (тип: ${typeof user.tweets_count})`);
    console.log(`  - friends_count: ${user.friends_count} (тип: ${typeof user.friends_count})`);
    console.log(`  - verified: ${user.verified} (тип: ${typeof user.verified})`);
    console.log(`  - register_date: ${user.register_date} (тип: ${typeof user.register_date})`);
    
    // Анализ smart
    console.log('\n👥 Smart структура:');
    console.log(`  - smart_followers: ${Array.isArray(smart.smart_followers) ? smart.smart_followers.length : 'не массив'}`);
    if (Array.isArray(smart.smart_followers)) {
      console.log(`  - Количество: ${smart.smart_followers.length}`);
      if (smart.smart_followers.length > 0) {
        console.log(`  - Первый элемент:`, smart.smart_followers[0]);
      }
    }
    
    // Анализ meta
    console.log('\n📈 Meta структура:');
    console.log(`  - median_followers: ${meta.median_followers} (тип: ${typeof meta.median_followers})`);
    console.log(`  - avg_smart_score: ${meta.avg_smart_score} (тип: ${typeof meta.avg_smart_score})`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

debugSophireum().catch(console.error); 