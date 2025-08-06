const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function debugInfoEndpoint() {
  const handle = 'sophireum';
  
  console.log('🔍 ОТЛАДКА INFO ENDPOINT');
  console.log('═'.repeat(80));

  const options = {
    hostname: 'api.tweetscout.io',
    path: `/v2/info/${handle}`,
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
        console.log('📊 Info Response:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n🔍 Анализ структуры:');
        console.log(`- followers_count: ${result.followers_count} (тип: ${typeof result.followers_count})`);
        console.log(`- public_metrics: ${result.public_metrics ? 'ЕСТЬ' : 'НЕТ'}`);
        if (result.public_metrics) {
          console.log(`  - followers_count: ${result.public_metrics.followers_count}`);
          console.log(`  - following_count: ${result.public_metrics.following_count}`);
          console.log(`  - tweet_count: ${result.public_metrics.tweet_count}`);
        }
        console.log(`- engagement_rate: ${result.engagement_rate} (тип: ${typeof result.engagement_rate})`);
        console.log(`- avg_likes: ${result.avg_likes} (тип: ${typeof result.avg_likes})`);
        console.log(`- avg_retweets: ${result.avg_retweets} (тип: ${typeof result.avg_retweets})`);
        console.log(`- created_at: ${result.created_at} (тип: ${typeof result.created_at})`);
        
        // Проверяем все ключи
        console.log('\n📋 Все ключи в ответе:');
        Object.keys(result).forEach(key => {
          console.log(`- ${key}: ${result[key]} (тип: ${typeof result[key]})`);
        });
        
      } catch (e) {
        console.error('❌ Error parsing JSON:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Network Error:', error.message);
  });

  req.end();
}

debugInfoEndpoint(); 