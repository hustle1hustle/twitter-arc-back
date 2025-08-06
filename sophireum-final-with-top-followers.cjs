const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tweetscout.io',
      path: `/v2${path}`,
      method: 'GET',
      headers: {
        'ApiKey': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 'error', data: error.message });
    });

    req.on('timeout', () => {
      resolve({ status: 'timeout', data: 'Request timeout' });
    });

    req.end();
  });
}

async function analyzeSophireum() {
  console.log('🔍 ДЕТАЛЬНЫЙ АНАЛИЗ @sophireum');
  console.log('═'.repeat(80));
  
  const handle = 'sophireum';
  
  // Получаем данные
  console.log('📡 Получаем данные...');
  const [info, topFollowers, score] = await Promise.all([
    makeRequest(`/info/${handle}`),
    makeRequest(`/top-followers/${handle}?from=db`),
    makeRequest(`/score/${handle}`)
  ]);
  
  console.log('\n📊 РЕЗУЛЬТАТЫ:');
  console.log('─'.repeat(40));
  
  // Основная информация
  if (info.status === 200 && !info.data.error) {
    const user = info.data;
    console.log(`👤 Пользователь: @${user.screen_name}`);
    console.log(`📝 Имя: ${user.name}`);
    console.log(`📅 Дата регистрации: ${user.register_date}`);
    console.log(`🔒 Защищенный: ${user.protected ? 'Да' : 'Нет'}`);
    console.log(`✅ Верифицирован: ${user.verified ? 'Да' : 'Нет'}`);
    console.log(`📊 Подписчики: ${user.followers_count?.toLocaleString() || 'N/A'}`);
    console.log(`👥 Подписки: ${user.friends_count?.toLocaleString() || 'N/A'}`);
    console.log(`📝 Твиты: ${user.statuses_count?.toLocaleString() || 'N/A'}`);
    console.log(`📈 Engagement Rate: ${user.engagement_rate?.toFixed(2) || 'N/A'}%`);
    console.log(`❤️ Средние лайки: ${user.avg_likes?.toLocaleString() || 'N/A'}`);
    console.log(`🔄 Средние ретвиты: ${user.avg_retweets?.toLocaleString() || 'N/A'}`);
  } else {
    console.log('❌ Ошибка получения основной информации:', info.status, info.data);
  }
  
  // TweetScout Score
  if (score.status === 200 && !score.data.error) {
    console.log(`\n🏆 TweetScout Score: ${score.data.score?.toFixed(2) || 'N/A'}`);
  } else {
    console.log('\n❌ Ошибка получения TweetScout Score:', score.status, score.data);
  }
  
  // Топ подписчики
  if (topFollowers.status === 200 && Array.isArray(topFollowers.data)) {
    console.log(`\n👑 ТОП 20 ПОДПИСЧИКОВ (по TweetScout Score):`);
    console.log('─'.repeat(60));
    
    topFollowers.data.forEach((follower, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. @${follower.screeName} (Score: ${follower.score?.toFixed(1) || 'N/A'}, Followers: ${follower.followersCount?.toLocaleString() || 'N/A'})`);
    });
    
    // Статистика топ подписчиков
    const validScores = topFollowers.data.filter(f => f.score && !isNaN(f.score));
    const validFollowers = topFollowers.data.filter(f => f.followersCount && !isNaN(f.followersCount));
    
    if (validScores.length > 0) {
      const avgScore = validScores.reduce((sum, f) => sum + f.score, 0) / validScores.length;
      const maxScore = Math.max(...validScores.map(f => f.score));
      const minScore = Math.min(...validScores.map(f => f.score));
      
      console.log(`\n📈 СТАТИСТИКА ТОП ПОДПИСЧИКОВ:`);
      console.log(`   Средний Score: ${avgScore.toFixed(1)}`);
      console.log(`   Максимальный Score: ${maxScore.toFixed(1)}`);
      console.log(`   Минимальный Score: ${minScore.toFixed(1)}`);
    }
    
    if (validFollowers.length > 0) {
      const avgFollowers = validFollowers.reduce((sum, f) => sum + f.followersCount, 0) / validFollowers.length;
      const totalFollowers = validFollowers.reduce((sum, f) => sum + f.followersCount, 0);
      
      console.log(`   Среднее количество подписчиков: ${avgFollowers.toLocaleString()}`);
      console.log(`   Общее количество подписчиков: ${totalFollowers.toLocaleString()}`);
    }
    
  } else {
    console.log('\n❌ Ошибка получения топ подписчиков:', topFollowers.status, topFollowers.data);
  }
  
  // Расчет REP Score
  console.log('\n🧮 РАСЧЕТ REP SCORE:');
  console.log('─'.repeat(40));
  
  if (info.status === 200 && topFollowers.status === 200 && score.status === 200) {
    const user = info.data;
    const followers = user.followers_count || 1;
    const topCount = Math.min(topFollowers.data.length, 5);
    const ageInYears = (Date.now() - Date.parse(user.register_date)) / (3.154e10);
    const engagementRate = user.engagement_rate || 0;
    const avgSmartScore = score.data.score || 0;
    
    const repScore = Math.round(
      0.35 * Math.log10(Math.max(followers, 1)) * 100 +
      0.25 * (topCount / Math.max(followers, 1)) * 1000 +
      0.15 * Math.sqrt(ageInYears) * 10 +
      0.15 * engagementRate +
      0.10 * (avgSmartScore / 10)
    );
    
    console.log(`📊 Подписчики: ${followers.toLocaleString()}`);
    console.log(`👑 Топ подписчиков: ${topCount}`);
    console.log(`📅 Возраст аккаунта: ${ageInYears.toFixed(1)} лет`);
    console.log(`📈 Engagement Rate: ${engagementRate.toFixed(2)}%`);
    console.log(`🏆 Средний Smart Score: ${avgSmartScore.toFixed(1)}`);
    console.log(`\n🎯 ФИНАЛЬНЫЙ REP SCORE: ${repScore}`);
    
  } else {
    console.log('❌ Недостаточно данных для расчета REP Score');
  }
  
  console.log('\n' + '═'.repeat(80));
}

analyzeSophireum().catch(console.error); 