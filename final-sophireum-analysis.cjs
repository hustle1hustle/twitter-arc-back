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
        'Content-Type': 'application/json',
      },
      timeout: 5000
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

function computeReputation(info, score) {
  const followers = info.followers_count || 0;
  
  // Возраст аккаунта в годах
  const createdDate = new Date(info.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);

  const repScore = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * 0 + // нет умных подписчиков
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * 0 + // engagement rate нет в API
    0.10 * ((score || 0) / 10)
  );

  return {
    rep: repScore,
    followers: followers,
    topFollowers: [], // нет данных
    topFollowersCount: 0,
    avgSmartScore: score || 0,
    medianFollowers: 0,
    accountAge: ageYears.toFixed(1),
    verified: info.verified,
    tweetsCount: info.tweets_count,
    score: score || 0,
    source: "tweetscout"
  };
}

function analyzeAccountType(followers, verified, ageYears) {
  if (followers >= 100000) return "Celebrity";
  if (followers >= 10000) return "Influencer";
  if (followers >= 1000) return "Regular";
  return "Newcomer";
}

function analyzeEngagementLevel(tweetsCount, followers, ageYears) {
  const tweetsPerYear = tweetsCount / ageYears;
  
  if (tweetsPerYear > 10000) return "Ultra Active";
  if (tweetsPerYear > 5000) return "Very Active";
  if (tweetsPerYear > 1000) return "Active";
  if (tweetsPerYear > 100) return "Moderate";
  return "Low Activity";
}

function generateDetailedInsights(info, reputation, score) {
  const insights = [];
  
  // Анализ размера аудитории
  if (info.followers_count >= 100000) {
    insights.push("🎯 Массовая аудитория - один из крупнейших аккаунтов в своей нише");
  } else if (info.followers_count >= 10000) {
    insights.push("📈 Растущее влияние - значительная и активная аудитория");
  } else if (info.followers_count >= 1000) {
    insights.push("🌱 Развивающийся аккаунт - стабильная база подписчиков");
  }
  
  // Анализ активности
  const tweetsPerYear = info.tweets_count / parseFloat(reputation.accountAge);
  if (tweetsPerYear > 10000) {
    insights.push("🔥 Ультра-активный - очень высокая активность и вовлеченность");
  } else if (tweetsPerYear > 5000) {
    insights.push("⚡ Высокая активность - регулярные и качественные публикации");
  } else if (tweetsPerYear > 1000) {
    insights.push("📝 Активный - стабильное присутствие в сети");
  } else if (tweetsPerYear < 100) {
    insights.push("📝 Низкая активность - редкие, но возможно более качественные публикации");
  }
  
  // Анализ верификации
  if (info.verified) {
    insights.push("✅ Верифицированный - подтвержденная авторитетность и доверие");
  }
  
  // Анализ TweetScout Score
  if (score > 2000) {
    insights.push("🏆 Elite TweetScout Score - исключительное качество контента и аудитории");
  } else if (score > 1000) {
    insights.push("⭐ High TweetScout Score - высокое качество и авторитетность");
  } else if (score > 500) {
    insights.push("📊 Good TweetScout Score - хорошие показатели качества");
  }
  
  // Анализ возраста
  if (parseFloat(reputation.accountAge) > 5) {
    insights.push("🕰️ Ветеран Twitter - долгосрочное присутствие и стабильность");
  } else if (parseFloat(reputation.accountAge) > 2) {
    insights.push("📅 Опытный пользователь - достаточный опыт в сети");
  }
  
  // Анализ соотношения твитов/подписчиков
  const tweetsPerFollower = info.followers_count > 0 ? info.tweets_count / info.followers_count : 0;
  if (tweetsPerFollower > 0.5) {
    insights.push("💬 Высокая активность - много контента для аудитории");
  } else if (tweetsPerFollower < 0.1) {
    insights.push("🎯 Селективный подход - качество важнее количества");
  }
  
  return insights;
}

async function finalSophireumAnalysis() {
  const handle = 'sophireum';
  
  console.log('🔍 ФИНАЛЬНЫЙ АНАЛИЗ @sophireum');
  console.log('═'.repeat(80));
  console.log('📊 Используем только работающие endpoints');
  console.log('═'.repeat(80));

  try {
    console.log(`\n📊 АНАЛИЗ @${handle}`);
    console.log('═'.repeat(60));

    console.log('🔍 TweetScout: Fetching info for @sophireum...');
    console.log('🔍 TweetScout: Fetching score for @sophireum...');

    const [info, score] = await Promise.all([
      makeRequest(`/info/${handle}`),
      makeRequest(`/score/${handle}`)
    ]);

    console.log(`\n📊 СТАТУС API ЗАПРОСОВ:`);
    console.log('─'.repeat(50));
    console.log(`✅ Info API: ${info.status === 200 ? 'УСПЕХ' : 'ОШИБКА'}`);
    console.log(`✅ Score API: ${score.status === 200 ? 'УСПЕХ' : 'ОШИБКА'}`);

    if (info.status !== 200) {
      console.log(`❌ Ошибка для @${handle}: Info API недоступен`);
      return;
    }

    const reputation = computeReputation(info.data, score.data?.score);
    const accountType = analyzeAccountType(info.data.followers_count, info.data.verified, parseFloat(reputation.accountAge));
    const engagementLevel = analyzeEngagementLevel(info.data.tweets_count, info.data.followers_count, parseFloat(reputation.accountAge));
    const insights = generateDetailedInsights(info.data, reputation, score.data?.score);

    console.log(`\n👤 ОСНОВНАЯ ИНФОРМАЦИЯ:`);
    console.log('─'.repeat(50));
    console.log(`📝 Имя: ${info.data.name}`);
    console.log(`🏷️ Username: @${info.data.screen_name}`);
    console.log(`🆔 ID: ${info.data.id}`);
    console.log(`📄 Описание: ${info.data.description}`);
    console.log(`📅 Дата регистрации: ${info.data.register_date}`);
    console.log(`✅ Верифицирован: ${info.data.verified ? 'ДА' : 'НЕТ'}`);
    console.log(`💬 Может получать DM: ${info.data.can_dm ? 'ДА' : 'НЕТ'}`);

    console.log(`\n📊 СТАТИСТИКА:`);
    console.log('─'.repeat(50));
    console.log(`🏆 REP Score: ${reputation.rep}`);
    console.log(`👥 Подписчики: ${reputation.followers?.toLocaleString()}`);
    console.log(`👤 Подписки: ${info.data.friends_count?.toLocaleString()}`);
    console.log(`🐦 Твиты: ${reputation.tweetsCount?.toLocaleString()}`);
    console.log(`📅 Возраст аккаунта: ${reputation.accountAge} лет`);
    console.log(`🏷️ Тип аккаунта: ${accountType}`);
    console.log(`⚡ Уровень активности: ${engagementLevel}`);
    console.log(`📈 TweetScout Score: ${reputation.score?.toFixed(2)}`);

    console.log(`\n📈 ДЕТАЛЬНЫЕ МЕТРИКИ:`);
    console.log('─'.repeat(50));
    const tweetsPerYear = info.data.tweets_count / parseFloat(reputation.accountAge);
    const tweetsPerFollower = info.data.followers_count > 0 ? info.data.tweets_count / info.data.followers_count : 0;
    const followerToFollowingRatio = info.data.friends_count > 0 ? info.data.followers_count / info.data.friends_count : 0;
    
    console.log(`📊 Твитов в год: ${tweetsPerYear.toFixed(0)}`);
    console.log(`📊 Твитов на подписчика: ${tweetsPerFollower.toFixed(3)}`);
    console.log(`📊 Соотношение подписчиков/подписок: ${followerToFollowingRatio.toFixed(2)}`);

    console.log(`\n📊 ТОП ПОДПИСЧИКИ:`);
    console.log('─'.repeat(50));
    console.log(`   ❌ Недоступно - endpoint зависает`);

    console.log(`\n📈 TWEETSCOUT МЕТРИКИ:`);
    console.log('─'.repeat(50));
    console.log(`   TweetScout Score: ${reputation.score?.toFixed(2)}`);
    console.log(`   Avg Smart Score: ${reputation.avgSmartScore?.toFixed(2)}`);
    console.log(`   Median Followers: ${reputation.medianFollowers?.toLocaleString()}`);

    console.log(`\n💡 ДЕТАЛЬНЫЕ ИНСАЙТЫ:`);
    console.log('─'.repeat(50));
    insights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });

    console.log(`\n🎯 КАТЕГОРИЗАЦИЯ:`);
    console.log('─'.repeat(50));
    console.log(`   По размеру аудитории: ${accountType}`);
    console.log(`   По активности: ${engagementLevel}`);
    console.log(`   По TweetScout Score: ${reputation.score > 2000 ? 'Elite' : reputation.score > 1000 ? 'High' : reputation.score > 500 ? 'Good' : 'Standard'}`);
    console.log(`   По возрасту: ${parseFloat(reputation.accountAge) > 5 ? 'Veteran' : parseFloat(reputation.accountAge) > 2 ? 'Experienced' : 'New'}`);

    console.log(`\n📊 РЕПУТАЦИОННЫЙ АНАЛИЗ:`);
    console.log('─'.repeat(50));
    const baseScore = Math.log10(Math.max(info.data.followers_count, 1)) * 100;
    const ageBonus = Math.sqrt(parseFloat(reputation.accountAge)) * 10;
    const scoreBonus = reputation.score || 0;
    
    console.log(`   Базовая оценка (подписчики): ${Math.round(baseScore)}`);
    console.log(`   Бонус за возраст: ${Math.round(ageBonus)}`);
    console.log(`   TweetScout Score бонус: ${Math.round(scoreBonus)}`);
    console.log(`   🏆 ИТОГОВАЯ РЕПУТАЦИЯ: ${reputation.rep}`);

    console.log(`\n🎉 ЗАКЛЮЧЕНИЕ:`);
    console.log('─'.repeat(50));
    console.log(`@${handle} демонстрирует ${accountType.toLowerCase()} статус с ${engagementLevel.toLowerCase()} активностью.`);
    console.log(`Аккаунт имеет ${info.data.followers_count?.toLocaleString()} подписчиков и ${info.data.tweets_count?.toLocaleString()} твитов.`);
    console.log(`TweetScout Score составляет ${reputation.score?.toFixed(2)}, что указывает на ${reputation.score > 2000 ? 'исключительное' : reputation.score > 1000 ? 'высокое' : reputation.score > 500 ? 'хорошее' : 'стандартное'} качество.`);
    console.log(`Общий REP Score: ${reputation.rep} - ${reputation.rep > 500 ? 'отличный' : reputation.rep > 300 ? 'хороший' : reputation.rep > 200 ? 'средний' : 'базовый'} уровень репутации.`);

    console.log(`\n⚠️ ОГРАНИЧЕНИЯ АНАЛИЗА:`);
    console.log('─'.repeat(50));
    console.log(`   ❌ Top Followers endpoint зависает (timeout)`);
    console.log(`   ❌ Smart Followers endpoint недоступен (404)`);
    console.log(`   ❌ Growth, Audience, Blue endpoints недоступны (404)`);
    console.log(`   ✅ Используем только доступные данные: info + score`);

  } catch (error) {
    console.error(`❌ Ошибка при анализе @${handle}:`, error.message);
  }
}

finalSophireumAnalysis().catch(console.error); 