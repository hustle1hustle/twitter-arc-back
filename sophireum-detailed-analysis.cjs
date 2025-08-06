const https = require('https');

class TweetScoutAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'api.tweetscout.io';
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: `/v2${path}`,
        method: 'GET',
        headers: {
          'ApiKey': this.apiKey,
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

  async getUser(handle) {
    console.log(`🔍 TweetScout: Fetching info for @${handle}...`);
    return this.makeRequest(`/info/${handle}`);
  }

  async getSmartFollowers(handle) {
    console.log(`🔍 TweetScout: Fetching smart followers for @${handle}...`);
    return this.makeRequest(`/smart_followers/${handle}?page=1`);
  }

  async getSmartMeta(handle) {
    console.log(`🔍 TweetScout: Fetching smart meta for @${handle}...`);
    return this.makeRequest(`/smart_followers/${handle}/meta`);
  }

  async getUserScore(handle) {
    console.log(`🔍 TweetScout: Fetching score for @${handle}...`);
    return this.makeRequest(`/score/${handle}`);
  }
}

function computeReputation(user, smartFollowers, meta, score) {
  const followers = user.followers_count || 0;
  const smartTop = (smartFollowers.smart_followers || []).slice(0, 5)
                   .map(s => `@${s.screen_name}`);
  const smartCount = smartTop.length;
  
  // Возраст аккаунта в годах
  const createdDate = new Date(user.register_date);
  const now = new Date();
  const ageYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);

  const repScore = Math.round(
    0.35 * Math.log10(Math.max(followers, 1)) * 100 +
    0.25 * (smartCount / Math.max(followers, 1)) * 1000 +
    0.15 * Math.sqrt(ageYears) * 10 +
    0.15 * (score?.score || 0) +
    0.10 * ((meta?.avg_smart_score || 0) / 10)
  );

  return {
    rep: repScore,
    followers: followers,
    smartTop,
    smartMedianFollowers: meta?.median_followers || 0,
    smartAvgScore: meta?.avg_smart_score || 0,
    accountAge: ageYears.toFixed(1),
    verified: user.verified,
    tweetsCount: user.tweets_count,
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

function getSmartFollowersAnalysis(smartFollowers) {
  const followers = smartFollowers.smart_followers || [];
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

function generateDetailedInsights(user, reputation, smartAnalysis, score) {
  const insights = [];
  
  // Анализ размера аудитории
  if (user.followers_count >= 100000) {
    insights.push("🎯 Массовая аудитория - один из крупнейших аккаунтов в своей нише");
  } else if (user.followers_count >= 10000) {
    insights.push("📈 Растущее влияние - значительная и активная аудитория");
  } else if (user.followers_count >= 1000) {
    insights.push("🌱 Развивающийся аккаунт - стабильная база подписчиков");
  }
  
  // Анализ активности
  const tweetsPerYear = user.tweets_count / parseFloat(reputation.accountAge);
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
  if (user.verified) {
    insights.push("✅ Верифицированный - подтвержденная авторитетность и доверие");
  }
  
  // Анализ TweetScout Score
  if (score?.score > 2000) {
    insights.push("🏆 Elite TweetScout Score - исключительное качество контента и аудитории");
  } else if (score?.score > 1000) {
    insights.push("⭐ High TweetScout Score - высокое качество и авторитетность");
  } else if (score?.score > 500) {
    insights.push("📊 Good TweetScout Score - хорошие показатели качества");
  }
  
  // Анализ умных подписчиков
  if (smartAnalysis.quality === "High") {
    insights.push("👑 Качественная аудитория - много верифицированных и влиятельных подписчиков");
  } else if (smartAnalysis.total > 0) {
    insights.push("👥 Умные подписчики - наличие качественной аудитории");
  }
  
  // Анализ возраста
  if (parseFloat(reputation.accountAge) > 5) {
    insights.push("🕰️ Ветеран Twitter - долгосрочное присутствие и стабильность");
  } else if (parseFloat(reputation.accountAge) > 2) {
    insights.push("📅 Опытный пользователь - достаточный опыт в сети");
  }
  
  // Анализ соотношения твитов/подписчиков
  const tweetsPerFollower = user.followers_count > 0 ? user.tweets_count / user.followers_count : 0;
  if (tweetsPerFollower > 0.5) {
    insights.push("💬 Высокая активность - много контента для аудитории");
  } else if (tweetsPerFollower < 0.1) {
    insights.push("🎯 Селективный подход - качество важнее количества");
  }
  
  return insights;
}

async function sophireumAnalysis() {
  const handle = 'sophireum';
  const apiKey = '3a40c7e0-66b8-4686-81eb-6bdccdbc3797';
  
  console.log('🔍 ДЕТАЛЬНЫЙ АНАЛИЗ @sophireum');
  console.log('═'.repeat(80));
  console.log('📊 TweetScout API v2 + Расширенная аналитика');
  console.log('═'.repeat(80));

  const tweetscout = new TweetScoutAPI(apiKey);

  try {
    console.log(`\n📊 АНАЛИЗ @${handle}`);
    console.log('═'.repeat(60));

    const [user, smartFollowers, meta, score] = await Promise.all([
      tweetscout.getUser(handle),
      tweetscout.getSmartFollowers(handle),
      tweetscout.getSmartMeta(handle),
      tweetscout.getUserScore(handle)
    ]);

    if (user.error || smartFollowers.error) {
      console.log(`❌ Ошибка для @${handle}: TweetScout недоступен`);
      return;
    }

    const reputation = computeReputation(user, smartFollowers, meta, score);
    const accountType = analyzeAccountType(user.followers_count, user.verified, parseFloat(reputation.accountAge));
    const engagementLevel = analyzeEngagementLevel(user.tweets_count, user.followers_count, parseFloat(reputation.accountAge));
    const smartAnalysis = getSmartFollowersAnalysis(smartFollowers);
    const insights = generateDetailedInsights(user, reputation, smartAnalysis, score);

    console.log(`\n👤 ОСНОВНАЯ ИНФОРМАЦИЯ:`);
    console.log('─'.repeat(50));
    console.log(`📝 Имя: ${user.name}`);
    console.log(`🏷️ Username: @${user.screen_name}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`📄 Описание: ${user.description}`);
    console.log(`🔗 URL: ${user.url || 'Не указан'}`);
    console.log(`📅 Дата регистрации: ${user.register_date}`);
    console.log(`✅ Верифицирован: ${user.verified ? 'ДА' : 'НЕТ'}`);
    console.log(`💬 Может получать DM: ${user.can_dm ? 'ДА' : 'НЕТ'}`);

    console.log(`\n📊 СТАТИСТИКА:`);
    console.log('─'.repeat(50));
    console.log(`🏆 REP Score: ${reputation.rep}`);
    console.log(`👥 Подписчики: ${reputation.followers?.toLocaleString()}`);
    console.log(`👤 Подписки: ${user.friends_count?.toLocaleString()}`);
    console.log(`🐦 Твиты: ${reputation.tweetsCount?.toLocaleString()}`);
    console.log(`📅 Возраст аккаунта: ${reputation.accountAge} лет`);
    console.log(`🏷️ Тип аккаунта: ${accountType}`);
    console.log(`⚡ Уровень активности: ${engagementLevel}`);

    console.log(`\n📈 ДЕТАЛЬНЫЕ МЕТРИКИ:`);
    console.log('─'.repeat(50));
    const tweetsPerYear = user.tweets_count / parseFloat(reputation.accountAge);
    const tweetsPerFollower = user.followers_count > 0 ? user.tweets_count / user.followers_count : 0;
    const followerToFollowingRatio = user.friends_count > 0 ? user.followers_count / user.friends_count : 0;
    
    console.log(`📊 Твитов в год: ${tweetsPerYear.toFixed(0)}`);
    console.log(`📊 Твитов на подписчика: ${tweetsPerFollower.toFixed(3)}`);
    console.log(`📊 Соотношение подписчиков/подписок: ${followerToFollowingRatio.toFixed(2)}`);
    console.log(`📊 TweetScout Score: ${score?.score?.toFixed(2) || 'N/A'}`);

    console.log(`\n📊 УМНЫЕ ПОДПИСЧИКИ:`);
    console.log('─'.repeat(50));
    console.log(`   Всего: ${smartAnalysis.total}`);
    console.log(`   Верифицированных: ${smartAnalysis.verified}`);
    console.log(`   Соотношение: ${smartAnalysis.verifiedRatio}`);
    console.log(`   Качество: ${smartAnalysis.quality}`);
    
    if (reputation.smartTop.length > 0) {
      console.log(`   Топ-5: ${reputation.smartTop.join(', ')}`);
    }

    console.log(`\n📈 SMART МЕТРИКИ:`);
    console.log('─'.repeat(50));
    console.log(`   Smart Median: ${reputation.smartMedianFollowers?.toLocaleString()}`);
    console.log(`   Smart Avg Score: ${reputation.smartAvgScore?.toFixed(2)}`);

    console.log(`\n💡 ДЕТАЛЬНЫЕ ИНСАЙТЫ:`);
    console.log('─'.repeat(50));
    insights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });

    console.log(`\n🎯 КАТЕГОРИЗАЦИЯ:`);
    console.log('─'.repeat(50));
    console.log(`   По размеру аудитории: ${accountType}`);
    console.log(`   По активности: ${engagementLevel}`);
    console.log(`   По TweetScout Score: ${score?.score > 2000 ? 'Elite' : score?.score > 1000 ? 'High' : score?.score > 500 ? 'Good' : 'Standard'}`);
    console.log(`   По возрасту: ${parseFloat(reputation.accountAge) > 5 ? 'Veteran' : parseFloat(reputation.accountAge) > 2 ? 'Experienced' : 'New'}`);

    console.log(`\n📊 РЕПУТАЦИОННЫЙ АНАЛИЗ:`);
    console.log('─'.repeat(50));
    const baseScore = Math.log10(Math.max(user.followers_count, 1)) * 100;
    const ageBonus = Math.sqrt(parseFloat(reputation.accountAge)) * 10;
    const tweetScoutBonus = score?.score || 0;
    const smartBonus = (meta?.avg_smart_score || 0) / 10;
    
    console.log(`   Базовая оценка (подписчики): ${Math.round(baseScore)}`);
    console.log(`   Бонус за возраст: ${Math.round(ageBonus)}`);
    console.log(`   TweetScout бонус: ${Math.round(tweetScoutBonus)}`);
    console.log(`   Smart бонус: ${Math.round(smartBonus)}`);
    console.log(`   🏆 ИТОГОВАЯ РЕПУТАЦИЯ: ${reputation.rep}`);

    console.log(`\n🎉 ЗАКЛЮЧЕНИЕ:`);
    console.log('─'.repeat(50));
    console.log(`@${handle} демонстрирует ${accountType.toLowerCase()} статус с ${engagementLevel.toLowerCase()} активностью.`);
    console.log(`Аккаунт имеет ${user.followers_count?.toLocaleString()} подписчиков и ${user.tweets_count?.toLocaleString()} твитов.`);
    console.log(`TweetScout Score составляет ${score?.score?.toFixed(2) || 'N/A'}, что указывает на ${score?.score > 2000 ? 'исключительное' : score?.score > 1000 ? 'высокое' : score?.score > 500 ? 'хорошее' : 'стандартное'} качество.`);
    console.log(`Общий REP Score: ${reputation.rep} - ${reputation.rep > 500 ? 'отличный' : reputation.rep > 300 ? 'хороший' : reputation.rep > 200 ? 'средний' : 'базовый'} уровень репутации.`);

  } catch (error) {
    console.error(`❌ Ошибка при анализе @${handle}:`, error.message);
  }
}

sophireumAnalysis().catch(console.error); 