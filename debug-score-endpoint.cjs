const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function testScoreEndpoint() {
  const handle = 'sophireum';
  
  console.log('🔍 ОТЛАДКА SCORE ENDPOINT');
  console.log('═'.repeat(80));

  const options = {
    hostname: 'api.tweetscout.io',
    path: `/v2/score/${handle}`,
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
        console.log('📊 Score Response:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n🔍 Анализ структуры:');
        console.log(`- score: ${result.score} (тип: ${typeof result.score})`);
        console.log(`- smart_followers_count: ${result.smart_followers_count} (тип: ${typeof result.smart_followers_count})`);
        console.log(`- avg_smart_score: ${result.avg_smart_score} (тип: ${typeof result.avg_smart_score})`);
        console.log(`- median_followers: ${result.median_followers} (тип: ${typeof result.median_followers})`);
        
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

testScoreEndpoint(); 