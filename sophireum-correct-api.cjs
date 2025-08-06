const https = require('https');

const API_KEY = "3a40c7e0-66b8-4686-81eb-6bdccdbc3797";

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
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
}

// Правильные методы согласно документации TweetScout API v2
const tsUser = (h) => makeRequest(`/v2/info/${h}`);
const tsTopFollowers = (h) => makeRequest(`/v2/top_followers/${h}`); // ПРАВИЛЬНЫЙ ENDPOINT!
const tsScore = (h) => makeRequest(`/v2/score/${h}`);

function computeReputation(user, topFollowers, score) {
  const followers = user.data.followers_count || 0;
  
  // Правильная обработка top followers согласно документации
  let topFollowersList = [];
  let topFollowersCount = 0;
  
  if (topFollowers && topFollowers.data && topFollowers.data.top_followers) {
    topFollowersList = topFollowers.data.top_followers.slice(0, 5).map(f => `@${f.screen_name}`);
    topFollowersCount = topFollowersList.length;
  }
  
  // Возраст аккаунта в годах
  const createdDate = new Date(user.data.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);

  const repScore = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * (topFollowersCount / Math.max(followers, 1)) * 1000 +
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * (score.data.score || 0) + // Используем score из API
    0.10 * ((topFollowers.data?.avg_smart_score || 0) / 10)
  );

  return {
    rep: repScore,
    followers: followers,
    topFollowers: topFollowersList,
    topFollowersCount: topFollowersCount,
    avgSmartScore: topFollowers.data?.avg_smart_score || 0,
    medianFollowers: topFollowers.data?.median_followers || 0,
    accountAge: ageYears.toFixed(1),
    verified: user.data.verified,
    tweetsCount: user.data.tweets_count,
    score: score.data.score || 0,
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

function getTopFollowersAnalysis(topFollowers) {
  if (!topFollowers || !topFollowers.data || !topFollowers.data.top_followers) {
    return {
      total: 0,
      verified: 0,
      verifiedRatio: "0.00",
      quality: "Low",
      error: "No data"
    };
  }
  
  const followers = topFollowers.data.top_followers;
  const verifiedCount = followers.filter(f => f.verified).length;
  const totalCount = followers.length;
  const verifiedRatio = totalCount > 0 ? verifiedCount / totalCount : 0;
  
  return {
    total: totalCount,
    verified: verifiedCount,
    verifiedRatio: verifiedRatio.toFixed(2),
    quality: verifiedRatio > 0.3 ? "High" : verifiedRatio > 0.1 ? "Medium" : "Low"
  };
}

function generateDetailedInsights(user, reputation, topFollowersAnalysis, score) {
  const insights = [];
  
  // Анализ размера аудитории
  if (user.data.followers_count >= 100000) {
    insights.push("🎯 Массовая аудитория - один из крупнейших аккаунтов в своей нише");
  } else if (user.data.followers_count >= 10000) {
    insights.push("📈 Растущее влияние - значительная и активная аудитория");
  } else if (user.data.followers_count >= 1000) {
    insights.push("🌱 Развивающийся аккаунт - стабильная база подписчиков");
  }
  
  // Анализ активности
  const tweetsPerYear = user.data.tweets_count / parseFloat(reputation.accountAge);
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
  if (user.data.verified) {
    insights.push("✅ Верифицированный - подтвержденная авторитетность и доверие");
  }
  
  // Анализ топ подписчиков
  if (topFollowersAnalysis.error) {
    insights.push("📊 Топ подписчики недоступны - возможно, аккаунт не в базе TweetScout");
  } else if (topFollowersAnalysis.quality === "High") {
    insights.push("👑 Качественная аудитория - много верифицированных и влиятельных подписчиков");
  } else if (topFollowersAnalysis.total > 0) {
    insights.push("👥 Топ подписчики - наличие качественной аудитории");
  } else {
    insights.push("👥 Нет топ подписчиков - возможно, аккаунт не анализировался TweetScout");
  }
  
  // Анализ возраста
  if (parseFloat(reputation.accountAge) > 5) {
    insights.push("🕰️ Ветеран Twitter - долгосрочное присутствие и стабильность");
  } else if (parseFloat(reputation.accountAge) > 2) {
    insights.push("📅 Опытный пользователь - достаточный опыт в сети");
  }
  
  // Анализ TweetScout Score
  if (score.data.score > 2000) {
    insights.push("🏆 Elite TweetScout Score - исключительное качество контента и аудитории");
  } else if (score.data.score > 1000) {
    insights.push("⭐ High TweetScout Score - высокое качество и авторитетность");
  } else if (score.data.score > 500) {
    insights.push("📊 Good TweetScout Score - хорошие показатели качества");
  }
  
  // Анализ соотношения твитов/подписчиков
  const tweetsPerFollower = user.data.followers_count > 0 ? user.data.tweets_count / user.data.followers_count : 0;
  if (tweetsPerFollower > 0.5) {
    insights.push("💬 Высокая активность - много контента для аудитории");
  } else if (tweetsPerFollower < 0.1) {
    insights.push("🎯 Селективный подход - качество важнее количества");
  }
  
  return insights;
}

async function sophireumCorrectAPIAnalysis() {
  const handle = 'sophireum';
  
  console.log('🔍 ИСПРАВЛЕННЫЙ АНАЛИЗ @sophireum');
  console.log('═'.repeat(80));
  console.log('📊 Используем правильные API endpoints согласно документации');
  console.log('═'.repeat(80));

  try {
    console.log(`\n📊 АНАЛИЗ @${handle}`);
    console.log('═'.repeat(60));

    console.log('🔍 TweetScout: Fetching info for @sophireum...');
    console.log('🔍 TweetScout: Fetching top followers for @sophireum...');
    console.log('🔍 TweetScout: Fetching score for @sophireum...');

    const [user, topFollowers, score] = await Promise.all([
      tsUser(handle),
      tsTopFollowers(handle),
      tsScore(handle)
    ]);

    console.log(`\n📊 СТАТУС API ЗАПРОСОВ:`);
    console.log('─'.repeat(50));
    console.log(`✅ User API: ${user.status === 200 ? 'УСПЕХ' : 'ОШИБКА'}`);
    console.log(`✅ Top Followers API: ${topFollowers.status === 200 ? 'УСПЕХ' : 'ОШИБКА'}`);
    console.log(`✅ Score API: ${score.status === 200 ? 'УСПЕХ' : 'ОШИБКА'}`);

    if (user.status !== 200) {
      console.log(`❌ Ошибка для @${handle}: User API недоступен`);
      return;
    }

    const reputation = computeReputation(user, topFollowers, score);
    const accountType = analyzeAccountType(user.data.followers_count, user.data.verified, parseFloat(reputation.accountAge));
    const engagementLevel = analyzeEngagementLevel(user.data.tweets_count, user.data.followers_count, parseFloat(reputation.accountAge));
    const topFollowersAnalysis = getTopFollowersAnalysis(topFollowers);
    const insights = generateDetailedInsights(user, reputation, topFollowersAnalysis, score);

    console.log(`\n👤 ОСНОВНАЯ ИНФОРМАЦИЯ:`);
    console.log('─'.repeat(50));
    console.log(`📝 Имя: ${user.data.name}`);
    console.log(`🏷️ Username: @${user.data.screen_name}`);
    console.log(`🆔 ID: ${user.data.id}`);
    console.log(`📄 Описание: ${user.data.description}`);
    console.log(`🔗 URL: ${user.data.url || 'Не указан'}`);
    console.log(`📅 Дата регистрации: ${user.data.register_date}`);
    console.log(`✅ Верифицирован: ${user.data.verified ? 'ДА' : 'НЕТ'}`);
    console.log(`💬 Может получать DM: ${user.data.can_dm ? 'ДА' : 'НЕТ'}`);

    console.log(`\n📊 СТАТИСТИКА:`);
    console.log('─'.repeat(50));
    console.log(`🏆 REP Score: ${reputation.rep}`);
    console.log(`👥 Подписчики: ${reputation.followers?.toLocaleString()}`);
    console.log(`👤 Подписки: ${user.data.friends_count?.toLocaleString()}`);
    console.log(`🐦 Твиты: ${reputation.tweetsCount?.toLocaleString()}`);
    console.log(`📅 Возраст аккаунта: ${reputation.accountAge} лет`);
    console.log(`🏷️ Тип аккаунта: ${accountType}`);
    console.log(`⚡ Уровень активности: ${engagementLevel}`);
    console.log(`📈 TweetScout Score: ${reputation.score?.toFixed(2)}`);

    console.log(`\n📈 ДЕТАЛЬНЫЕ МЕТРИКИ:`);
    console.log('─'.repeat(50));
    const tweetsPerYear = user.data.tweets_count / parseFloat(reputation.accountAge);
    const tweetsPerFollower = user.data.followers_count > 0 ? user.data.tweets_count / user.data.followers_count : 0;
    const followerToFollowingRatio = user.data.friends_count > 0 ? user.data.followers_count / user.data.friends_count : 0;
    
    console.log(`📊 Твитов в год: ${tweetsPerYear.toFixed(0)}`);
    console.log(`📊 Твитов на подписчика: ${tweetsPerFollower.toFixed(3)}`);
    console.log(`📊 Соотношение подписчиков/подписок: ${followerToFollowingRatio.toFixed(2)}`);

    console.log(`\n📊 ТОП ПОДПИСЧИКИ:`);
    console.log('─'.repeat(50));
    console.log(`   Всего: ${topFollowersAnalysis.total}`);
    console.log(`   Верифицированных: ${topFollowersAnalysis.verified}`);
    console.log(`   Соотношение: ${topFollowersAnalysis.verifiedRatio}`);
    console.log(`   Качество: ${topFollowersAnalysis.quality}`);
    if (topFollowersAnalysis.error) {
      console.log(`   ❌ Ошибка: ${topFollowersAnalysis.error}`);
    }
    
    if (reputation.topFollowers.length > 0) {
      console.log(`   Топ-5: ${reputation.topFollowers.join(', ')}`);
    }

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
    const baseScore = Math.log10(Math.max(user.data.followers_count, 1)) * 100;
    const ageBonus = Math.sqrt(parseFloat(reputation.accountAge)) * 10;
    const scoreBonus = reputation.score || 0;
    const smartBonus = reputation.avgSmartScore / 10;
    
    console.log(`   Базовая оценка (подписчики): ${Math.round(baseScore)}`);
    console.log(`   Бонус за возраст: ${Math.round(ageBonus)}`);
    console.log(`   TweetScout Score бонус: ${Math.round(scoreBonus)}`);
    console.log(`   Smart Score бонус: ${Math.round(smartBonus)}`);
    console.log(`   🏆 ИТОГОВАЯ РЕПУТАЦИЯ: ${reputation.rep}`);

    console.log(`\n🎉 ЗАКЛЮЧЕНИЕ:`);
    console.log('─'.repeat(50));
    console.log(`@${handle} демонстрирует ${accountType.toLowerCase()} статус с ${engagementLevel.toLowerCase()} активностью.`);
    console.log(`Аккаунт имеет ${user.data.followers_count?.toLocaleString()} подписчиков и ${user.data.tweets_count?.toLocaleString()} твитов.`);
    console.log(`TweetScout Score составляет ${reputation.score?.toFixed(2)}, что указывает на ${reputation.score > 2000 ? 'исключительное' : reputation.score > 1000 ? 'высокое' : reputation.score > 500 ? 'хорошее' : 'стандартное'} качество.`);
    console.log(`Общий REP Score: ${reputation.rep} - ${reputation.rep > 500 ? 'отличный' : reputation.rep > 300 ? 'хороший' : reputation.rep > 200 ? 'средний' : 'базовый'} уровень репутации.`);

    console.log(`\n✅ ИСПОЛЬЗОВАНЫ ПРАВИЛЬНЫЕ API ENDPOINTS:`);
    console.log('─'.repeat(50));
    console.log(`   ✅ /v2/info/{handle} - информация о пользователе`);
    console.log(`   ✅ /v2/top_followers/{handle} - топ подписчики (согласно документации)`);
    console.log(`   ✅ /v2/score/{handle} - TweetScout Score`);

  } catch (error) {
    console.error(`❌ Ошибка при анализе @${handle}:`, error.message);
  }
}

sophireumCorrectAPIAnalysis().catch(console.error); 